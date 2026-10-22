import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { Documento } from '../../core/models/documento.model';
import { DocumentosService } from '../../core/services/documentos.service';
import { mensajeDeError } from '../../core/mensaje-error';
import { Icono } from '../../shared/icono/icono';

const SANGRIA = '    ';

@Component({
  selector: 'app-editor',
  imports: [Icono],
  templateUrl: './editor.html',
  styleUrl: './editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown.control.s)': 'atajoGuardar($event)',
    '(window:keydown.meta.s)': 'atajoGuardar($event)',
    '(window:beforeunload)': 'avisarAntesDeSalir($event)',
  },
})
export class Editor implements OnInit {
  private readonly documentos = inject(DocumentosService);
  private readonly router = inject(Router);

  // Viene del parametro 
  readonly id = input.required<string>();

  protected readonly documento = signal<Documento | null>(null);
  protected readonly textoInicial = signal('');
  protected readonly contenido = signal('');
  private readonly contenidoGuardado = signal('');

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly linea = signal(1);
  protected readonly columna = signal(1);

  protected readonly sinGuardar = computed(() => this.contenido() !== this.contenidoGuardado());

  protected readonly numerosDeLinea = computed(() => {
    const total = this.contenido().split('\n').length;
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  ngOnInit() {
    this.documentos.obtener(this.id()).subscribe({
      next: ({ documento, contenido }) => {
        this.documento.set(documento);
        this.textoInicial.set(contenido);
        this.contenido.set(contenido);
        this.contenidoGuardado.set(contenido);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected alEscribir(area: HTMLTextAreaElement) {
    this.contenido.set(area.value);
    this.actualizarCursor(area);
  }

  // Calcula linea y columna a partir de la posicion del cursor
  protected actualizarCursor(area: HTMLTextAreaElement) {
    const antes = area.value.slice(0, area.selectionStart);
    const lineas = antes.split('\n');
    this.linea.set(lineas.length);
    this.columna.set(lineas[lineas.length - 1].length + 1);
  }

  // Tab escribe espacios en lugar de salir del editor
  protected alPresionarTecla(evento: KeyboardEvent, area: HTMLTextAreaElement) {
    if (evento.key !== 'Tab') return;
    evento.preventDefault();
    area.setRangeText(SANGRIA, area.selectionStart, area.selectionEnd, 'end');
    this.alEscribir(area);
  }

  protected guardar() {
    const documento = this.documento();
    if (!documento || !this.sinGuardar() || this.guardando()) return;

    const texto = this.contenido();
    this.guardando.set(true);
    this.error.set(null);

    this.documentos.guardarContenido(documento._id, texto).subscribe({
      next: (actualizado) => {
        this.documento.set(actualizado);
        this.contenidoGuardado.set(texto);
        this.guardando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.guardando.set(false);
      },
    });
  }

  protected descargar() {
    const documento = this.documento();
    if (!documento) return;
    this.documentos.descargar(documento).subscribe({
      error: (err: HttpErrorResponse) => this.error.set(mensajeDeError(err)),
    });
  }

  protected volver() {
    if (this.sinGuardar() && !confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) {
      return;
    }
    // Regresa a la carpeta donde esta el documento
    const carpetaId = this.documento()?.carpetaId;
    this.router.navigate(carpetaId ? ['/carpetas', carpetaId] : ['/inicio']);
  }

  protected atajoGuardar(evento: Event) {
    evento.preventDefault();
    this.guardar();
  }

  protected avisarAntesDeSalir(evento: BeforeUnloadEvent) {
    if (this.sinGuardar()) {
      evento.preventDefault();
    }
  }
}
