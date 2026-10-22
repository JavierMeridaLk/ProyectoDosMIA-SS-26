import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { PapeleraService } from '../../core/services/papelera.service';
import { UnidadService } from '../../core/services/unidad.service';
import { ElementoPapelera } from '../../core/models/papelera.model';
import { mensajeDeError } from '../../core/mensaje-error';
import { Icono } from '../../shared/icono/icono';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';
import { Confirmacion } from '../../shared/confirmacion/confirmacion';

@Component({
  selector: 'app-papelera',
  imports: [Icono, BytesPipe, DatePipe, Confirmacion],
  templateUrl: './papelera.html',
  styleUrl: './papelera.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Papelera implements OnInit {
  private readonly papelera = inject(PapeleraService);
  private readonly unidad = inject(UnidadService);

  protected readonly elementos = signal<ElementoPapelera[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  // Elemento que se esta por eliminar definitivamente (abre la confirmacion)
  protected readonly porEliminar = signal<ElementoPapelera | null>(null);
  protected readonly eliminando = signal(false);
  // Id del elemento que se esta restaurando, para deshabilitar sus botones
  protected readonly procesandoId = signal<string | null>(null);

  ngOnInit() {
    // En la papelera lo que se cree desde la barra lateral va a la raiz
    this.unidad.carpetaActualId.set(null);

    this.papelera.listar().subscribe({
      next: (elementos) => {
        this.elementos.set(elementos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected restaurar(elemento: ElementoPapelera) {
    this.procesandoId.set(elemento._id);
    this.papelera.restaurar(elemento).subscribe({
      next: (ubicacion) => {
        this.quitar(elemento);
        this.procesandoId.set(null);
        this.unidad.avisar(`«${elemento.nombre}» se restauró en ${ubicacion}`);
      },
      error: (err: HttpErrorResponse) => {
        this.procesandoId.set(null);
        this.unidad.avisar(mensajeDeError(err), 'error');
      },
    });
  }

  protected confirmarEliminacion() {
    const elemento = this.porEliminar();
    if (!elemento) return;

    this.eliminando.set(true);
    this.papelera.eliminarDefinitivo(elemento).subscribe({
      next: () => {
        this.quitar(elemento);
        this.porEliminar.set(null);
        this.eliminando.set(false);
        // Al borrar definitivamente se libera espacio
        this.unidad.cargarUso();
        this.unidad.avisar(`«${elemento.nombre}» se eliminó definitivamente`);
      },
      error: (err: HttpErrorResponse) => {
        this.porEliminar.set(null);
        this.eliminando.set(false);
        this.unidad.avisar(mensajeDeError(err), 'error');
      },
    });
  }

  protected mensajeConfirmacion(elemento: ElementoPapelera) {
    return elemento.tipo === 'carpetas'
      ? `La carpeta «${elemento.nombre}» y todo su contenido se eliminarán para siempre. Esta acción no se puede deshacer.`
      : `«${elemento.nombre}» se eliminará para siempre. Esta acción no se puede deshacer.`;
  }

  private quitar(elemento: ElementoPapelera) {
    this.elementos.update((lista) => lista.filter((e) => e._id !== elemento._id));
  }
}
