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
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import {
  DocumentosService,
  EXTENSIONES_PERMITIDAS,
  TAMANO_MAXIMO,
} from '../../core/services/documentos.service';
import { Documento } from '../../core/models/documento.model';
import { mensajeDeError } from '../../core/mensaje-error';
import { Icono } from '../../shared/icono/icono';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';
import { NuevoDocumento } from './nuevo-documento/nuevo-documento';

@Component({
  selector: 'app-inicio',
  imports: [Icono, BytesPipe, DatePipe, NuevoDocumento],
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
  private readonly router = inject(Router);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  protected readonly menuAbierto = signal(false);
  protected readonly mostrarNuevo = signal(false);
  protected readonly subiendo = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly documentos = signal<Documento[]>([]);
  protected readonly usado = signal(0);

  protected readonly porcentajeUsado = computed(() => {
    const total = this.auth.usuario()?.almacenamiento ?? 0;
    return total ? Math.min(100, Math.round((this.usado() / total) * 100)) : 0;
  });

  protected readonly iniciales = computed(() =>
    (this.auth.usuario()?.user ?? '').slice(0, 2).toUpperCase(),
  );

  ngOnInit() {
    this.auth.refrescarPerfil().subscribe({ error: () => {} });
    this.cargarDocumentos();
  }

  protected abrir(documento: Documento) {
    this.router.navigate(['/documentos', documento._id]);
  }

  protected alCrear(documento: Documento) {
    this.mostrarNuevo.set(false);
    this.abrir(documento);
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
    this.documentosService.subir(archivo).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.cargarDocumentos();
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

  private cargarDocumentos() {
    this.documentosService.listar().subscribe({
      next: (documentos) => this.documentos.set(documentos),
      error: (err: HttpErrorResponse) => this.error.set(mensajeDeError(err)),
    });
    this.documentosService.almacenamiento().subscribe({
      next: ({ usado }) => this.usado.set(usado),
      error: () => {},
    });
  }
}
