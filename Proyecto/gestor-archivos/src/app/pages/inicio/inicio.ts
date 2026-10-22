import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import {
  DocumentosService,
  EXTENSIONES_PERMITIDAS,
  TAMANO_MAXIMO,
} from '../../core/services/documentos.service';
import { CarpetasService } from '../../core/services/carpetas.service';
import { Documento } from '../../core/models/documento.model';
import { Carpeta, CarpetaEnRuta } from '../../core/models/carpeta.model';
import { mensajeDeError } from '../../core/mensaje-error';
import { Icono } from '../../shared/icono/icono';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';
import { NuevoDocumento } from './nuevo-documento/nuevo-documento';
import { NuevaCarpeta } from './nueva-carpeta/nueva-carpeta';

@Component({
  selector: 'app-inicio',
  imports: [Icono, BytesPipe, DatePipe, RouterLink, NuevoDocumento, NuevaCarpeta],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'cerrarMenuSiEsFuera($event)',
    '(document:keydown.escape)': 'menuAbierto.set(false)',
  },
})
export class Inicio implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly documentosService = inject(DocumentosService);
  private readonly carpetasService = inject(CarpetasService);
  private readonly router = inject(Router);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  // Parametro :id de /carpetas/:id. En /inicio no viene (raiz)
  readonly id = input<string>();

  protected readonly menuAbierto = signal(false);
  protected readonly mostrarNuevo = signal(false);
  protected readonly mostrarNuevaCarpeta = signal(false);
  protected readonly subiendo = signal(false);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly carpetaActual = signal<Carpeta | null>(null);
  protected readonly ruta = signal<CarpetaEnRuta[]>([]);
  protected readonly carpetas = signal<Carpeta[]>([]);
  protected readonly documentos = signal<Documento[]>([]);
  protected readonly usado = signal(0);

  protected readonly vacia = computed(
    () => !this.carpetas().length && !this.documentos().length,
  );

  protected readonly porcentajeUsado = computed(() => {
    const total = this.auth.usuario()?.almacenamiento ?? 0;
    return total ? Math.min(100, Math.round((this.usado() / total) * 100)) : 0;
  });

  protected readonly iniciales = computed(() =>
    (this.auth.usuario()?.user ?? '').slice(0, 2).toUpperCase(),
  );

  private cargaActual?: Subscription;

  constructor() {
    // Al pasar de una carpeta a otra Angular reutiliza el componente, solo cambia el id
    effect(() => {
      const id = this.id() ?? null;
      untracked(() => this.cargarContenido(id));
    });
  }

  ngOnInit() {
    this.auth.refrescarPerfil().subscribe({ error: () => {} });
    this.cargarUso();
  }

  protected abrir(documento: Documento) {
    this.router.navigate(['/documentos', documento._id]);
  }

  protected abrirCarpeta(carpeta: Carpeta) {
    this.router.navigate(['/carpetas', carpeta._id]);
  }

  protected alCrear(documento: Documento) {
    this.mostrarNuevo.set(false);
    this.abrir(documento);
  }

  protected alCrearCarpeta() {
    this.mostrarNuevaCarpeta.set(false);
    this.cargarContenido(this.id() ?? null);
  }

  protected subir(evento: Event) {
    const selector = evento.target as HTMLInputElement;
    const archivo = selector.files?.[0];
    // Se limpia para poder volver a elegir el mismo archivo
    selector.value = '';
    if (!archivo) return;

    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      this.error.set('Solo se permiten archivos .txt y .md');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      this.error.set('El archivo supera el tamaño máximo de 5 MB');
      return;
    }

    this.subiendo.set(true);
    this.error.set(null);
    this.documentosService.subir(archivo, this.id() ?? null).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.cargarContenido(this.id() ?? null);
        this.cargarUso();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
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

  private cargarUso() {
    this.documentosService.almacenamiento().subscribe({
      next: ({ usado }) => this.usado.set(usado),
      error: () => {},
    });
  }
}
