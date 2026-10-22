import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import {
  DocumentosService,
  EXTENSIONES_PERMITIDAS,
  TAMANO_MAXIMO,
} from '../../core/services/documentos.service';
import { UnidadService } from '../../core/services/unidad.service';
import { Documento } from '../../core/models/documento.model';
import { Carpeta } from '../../core/models/carpeta.model';
import { mensajeDeError } from '../../core/mensaje-error';
import { Icono } from '../../shared/icono/icono';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';
import { NuevoDocumento } from './nuevo-documento/nuevo-documento';
import { NuevaCarpeta } from './nueva-carpeta/nueva-carpeta';

// Barra superior + menu lateral, comun a Mi Unidad, carpetas y Papelera
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, Icono, BytesPipe, DatePipe, NuevoDocumento, NuevaCarpeta],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'cerrarMenuSiEsFuera($event)',
    '(document:keydown.escape)': 'menuAbierto.set(false)',
  },
})
export class Layout implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly unidad = inject(UnidadService);
  private readonly documentosService = inject(DocumentosService);
  private readonly router = inject(Router);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  protected readonly menuAbierto = signal(false);
  protected readonly mostrarNuevo = signal(false);
  protected readonly mostrarNuevaCarpeta = signal(false);
  protected readonly subiendo = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly enPapelera = computed(() => this.url().startsWith('/papelera'));

  protected readonly porcentajeUsado = computed(() => {
    const total = this.auth.usuario()?.almacenamiento ?? 0;
    return total ? Math.min(100, Math.round((this.unidad.usado() / total) * 100)) : 0;
  });

  protected readonly iniciales = computed(() =>
    (this.auth.usuario()?.user ?? '').slice(0, 2).toUpperCase(),
  );

  ngOnInit() {
    this.auth.refrescarPerfil().subscribe({ error: () => {} });
    this.unidad.cargarUso();
  }

  protected alCrear(documento: Documento) {
    this.mostrarNuevo.set(false);
    this.router.navigate(['/documentos', documento._id]);
  }

  protected alCrearCarpeta(carpeta: Carpeta) {
    this.mostrarNuevaCarpeta.set(false);
    this.mostrarResultado(`Carpeta «${carpeta.nombre}» creada`);
  }

  protected subir(evento: Event) {
    const selector = evento.target as HTMLInputElement;
    const archivo = selector.files?.[0];
    // Se limpia para poder volver a elegir el mismo archivo
    selector.value = '';
    if (!archivo) return;

    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      this.unidad.avisar('Solo se permiten archivos .txt y .md', 'error');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      this.unidad.avisar('El archivo supera el tamaño máximo de 5 MB', 'error');
      return;
    }

    this.subiendo.set(true);
    this.documentosService.subir(archivo, this.unidad.carpetaActualId()).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.unidad.cargarUso();
        this.mostrarResultado(`«${archivo.name}» se subió correctamente`);
      },
      error: (err: HttpErrorResponse) => {
        this.unidad.avisar(mensajeDeError(err), 'error');
        this.subiendo.set(false);
      },
    });
  }

  // Cierra el panel del usuario al hacer clic en cualquier parte fuera
  protected cerrarMenuSiEsFuera(evento: MouseEvent) {
    const perfil = this.elemento.nativeElement.querySelector('.perfil');
    if (this.menuAbierto() && !perfil?.contains(evento.target as Node)) {
      this.menuAbierto.set(false);
    }
  }

  // Desde la papelera lo nuevo se crea en Mi Unidad, asi que se lleva al usuario ahi
  private mostrarResultado(texto: string) {
    this.unidad.avisar(texto);
    if (this.enPapelera()) {
      this.router.navigate(['/inicio']);
    } else {
      this.unidad.recargarContenido();
    }
  }
}
