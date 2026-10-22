import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Carpeta } from '../../../core/models/carpeta.model';
import { CarpetasService } from '../../../core/services/carpetas.service';
import { mensajeDeError } from '../../../core/mensaje-error';
import { Icono } from '../../../shared/icono/icono';

@Component({
  selector: 'app-nueva-carpeta',
  imports: [ReactiveFormsModule, Icono],
  templateUrl: './nueva-carpeta.html',
  styleUrl: '../dialogo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
})
export class NuevaCarpeta {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly carpetas = inject(CarpetasService);

  // Carpeta donde se crea, null = raiz
  readonly padreId = input<string | null>(null);
  readonly creada = output<Carpeta>();
  readonly cerrar = output<void>();

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly campoNombre = viewChild.required<ElementRef<HTMLInputElement>>('campoNombre');

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[^\\/]+$/)]],
  });

  constructor() {
    afterNextRender(() => this.campoNombre().nativeElement.focus());
  }

  protected crear() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    this.carpetas.crear(this.form.getRawValue().nombre.trim(), this.padreId()).subscribe({
      next: (carpeta) => this.creada.emit(carpeta),
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
