import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Icono } from '../icono/icono';

// Dialogo para confirmar acciones que no se pueden deshacer
@Component({
  selector: 'app-confirmacion',
  imports: [Icono],
  styleUrl: '../dialogo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cancelar.emit()' },
  template: `
    <div class="fondo" (click)="cancelar.emit()">
      <section
        class="dialogo"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-confirmacion"
        aria-describedby="mensaje-confirmacion"
        (click)="$event.stopPropagation()"
      >
        <header>
          <h2 id="titulo-confirmacion">{{ titulo() }}</h2>
          <button type="button" class="cerrar" aria-label="Cerrar" (click)="cancelar.emit()">
            <app-icono nombre="cerrar" [tamano]="18" />
          </button>
        </header>
        <div class="cuerpo">
          <p id="mensaje-confirmacion">{{ mensaje() }}</p>
          <footer>
            <button type="button" class="boton boton-borde" (click)="cancelar.emit()">
              Cancelar
            </button>
            <button
              type="button"
              class="boton boton-peligro"
              [disabled]="procesando()"
              (click)="confirmar.emit()"
            >
              {{ procesando() ? 'Procesando…' : textoConfirmar() }}
            </button>
          </footer>
        </div>
      </section>
    </div>
  `,
})
export class Confirmacion {
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly textoConfirmar = input('Eliminar');
  readonly procesando = input(false);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
