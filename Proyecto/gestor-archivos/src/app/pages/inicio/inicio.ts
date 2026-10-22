import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { DocumentosService } from '../../core/services/documentos.service';
import { CarpetasService } from '../../core/services/carpetas.service';
import { UnidadService } from '../../core/services/unidad.service';
import { Documento } from '../../core/models/documento.model';
import { Carpeta, CarpetaEnRuta } from '../../core/models/carpeta.model';
import { mensajeDeError } from '../../core/mensaje-error';
import { Icono } from '../../shared/icono/icono';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';

// Contenido de Mi Unidad o de una carpeta (/inicio y /carpetas/:id)
@Component({
  selector: 'app-inicio',
  imports: [Icono, BytesPipe, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inicio {
  protected readonly auth = inject(AuthService);
  private readonly unidad = inject(UnidadService);
  private readonly documentosService = inject(DocumentosService);
  private readonly carpetasService = inject(CarpetasService);
  private readonly router = inject(Router);

  // Parametro :id de /carpetas/:id. En /inicio no viene (raiz)
  readonly id = input<string>();

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly carpetaActual = signal<Carpeta | null>(null);
  protected readonly ruta = signal<CarpetaEnRuta[]>([]);
  protected readonly carpetas = signal<Carpeta[]>([]);
  protected readonly documentos = signal<Documento[]>([]);

  protected readonly vacia = computed(
    () => !this.carpetas().length && !this.documentos().length,
  );

  private cargaActual?: Subscription;

  constructor() {
    // Se recarga al cambiar de carpeta o cuando el layout crea/sube algo
    effect(() => {
      const id = this.id() ?? null;
      this.unidad.version();
      untracked(() => {
        this.unidad.carpetaActualId.set(id);
        this.cargarContenido(id);
      });
    });
  }

  protected abrir(documento: Documento) {
    this.router.navigate(['/documentos', documento._id]);
  }

  protected abrirCarpeta(carpeta: Carpeta) {
    this.router.navigate(['/carpetas', carpeta._id]);
  }

  // Mover a la papelera no pide confirmacion porque se puede restaurar
  protected eliminarCarpeta(carpeta: Carpeta) {
    this.carpetasService.eliminar(carpeta._id).subscribe({
      next: () => {
        this.carpetas.update((lista) => lista.filter((c) => c._id !== carpeta._id));
        this.unidad.avisar(`«${carpeta.nombre}» se movió a la papelera`);
      },
      error: (err: HttpErrorResponse) => this.unidad.avisar(mensajeDeError(err), 'error'),
    });
  }

  protected eliminarDocumento(documento: Documento) {
    this.documentosService.eliminar(documento._id).subscribe({
      next: () => {
        this.documentos.update((lista) => lista.filter((d) => d._id !== documento._id));
        this.unidad.avisar(`«${documento.nombre}.${documento.extension}» se movió a la papelera`);
      },
      error: (err: HttpErrorResponse) => this.unidad.avisar(mensajeDeError(err), 'error'),
    });
  }

  private cargarContenido(id: string | null) {
    // Si se navega rapido entre carpetas se cancela la peticion anterior
    this.cargaActual?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.cargaActual = this.carpetasService.contenido(id).subscribe({
      next: ({ carpeta, ruta, carpetas, documentos }) => {
        this.carpetaActual.set(carpeta);
        this.ruta.set(ruta);
        this.carpetas.set(carpetas);
        this.documentos.set(documentos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.carpetaActual.set(null);
        this.ruta.set([]);
        this.carpetas.set([]);
        this.documentos.set([]);
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
