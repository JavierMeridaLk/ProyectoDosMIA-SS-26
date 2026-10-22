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
import { Observable } from 'rxjs';

import { CarpetasService } from '../../../core/services/carpetas.service';
import { DocumentosService } from '../../../core/services/documentos.service';
import { mensajeDeError } from '../../../core/mensaje-error';
import { Icono } from '../../../shared/icono/icono';
import { nombreCompleto, Seleccion } from '../seleccion';

@Component({
  selector: 'app-renombrar',
  imports: [Icono],
  templateUrl: './renombrar.html',
  styleUrl: '../../../shared/dialogo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
})
export class Renombrar {
  private readonly carpetas = inject(CarpetasService);
  private readonly documentos = inject(DocumentosService);

  readonly seleccion = input.required<Seleccion>();
  // Devuelve el nombre nuevo 
  readonly renombrado = output<string>();
  readonly cerrar = output<void>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  constructor() {
    // Se selecciona el nombre actual para poder escribir encima directamente
    afterNextRender(() => {
      this.campo().nativeElement.focus();
      this.campo().nativeElement.select();
    });
  }

  protected guardar(valor: string) {
    const nombre = valor.trim();
    const seleccion = this.seleccion();
    if (!nombre || /[\\/]/.test(nombre)) {
      this.error.set('Escribe un nombre válido (sin / ni \\)');
      return;
    }
    if (nombre === seleccion.nombre) {
      this.cerrar.emit();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    const peticion: Observable<unknown> =
      seleccion.tipo === 'carpetas'
        ? this.carpetas.renombrar(seleccion.id, nombre)
        : this.documentos.renombrar(seleccion.id, nombre);

    peticion.subscribe({
      next: () => this.renombrado.emit(nombreCompleto({ ...seleccion, nombre })),
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.guardando.set(false);
      },
    });
  }
}
