import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Documento, Extension } from '../../../core/models/documento.model';
import { DocumentosService } from '../../../core/services/documentos.service';
import { mensajeDeError } from '../../../core/mensaje-error';
import { Icono } from '../../../shared/icono/icono';

@Component({
  selector: 'app-nuevo-documento',
  imports: [ReactiveFormsModule, Icono],
  templateUrl: './nuevo-documento.html',
  styleUrl: './nuevo-documento.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
})
export class NuevoDocumento {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly documentos = inject(DocumentosService);

  readonly creado = output<Documento>();
  readonly cerrar = output<void>();

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly campoNombre = viewChild.required<ElementRef<HTMLInputElement>>('campoNombre');

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[^\\/]+$/)]],
    extension: ['txt' as Extension],
  });

  constructor() {
    afterNextRender(() => this.campoNombre().nativeElement.focus());
  }

  protected crear() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, extension } = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set(null);

    this.documentos.crear(nombre.trim(), extension).subscribe({
      next: (documento) => this.creado.emit(documento),
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
