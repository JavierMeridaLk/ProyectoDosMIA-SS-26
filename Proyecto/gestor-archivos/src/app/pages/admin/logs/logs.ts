import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { ActividadService, FiltrosLogs } from '../../../core/services/actividad.service';
import { UnidadService } from '../../../core/services/unidad.service';
import { ACCIONES, RegistroActividad } from '../../../core/models/actividad.model';
import { mensajeDeError } from '../../../core/mensaje-error';
import { Icono } from '../../../shared/icono/icono';
import { ListaActividad } from '../../../shared/lista-actividad/lista-actividad';

@Component({
  selector: 'app-logs',
  imports: [Icono, KeyValuePipe, ListaActividad],
  templateUrl: './logs.html',
  styleUrl: './logs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logs implements OnInit {
  private readonly actividad = inject(ActividadService);
  private readonly unidad = inject(UnidadService);

  protected readonly acciones = ACCIONES;
  // se conserva el orden en que estan declaradas
  protected readonly sinOrden = () => 0;

  protected readonly filtros = signal<FiltrosLogs>({ accion: '', desde: '', hasta: '', usuario: '', tipo: '' });
  protected readonly registros = signal<RegistroActividad[]>([]);
  protected readonly hayMas = signal(false);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.unidad.carpetaActualId.set(null);
    this.unidad.vistaPropia.set(false);
    this.cargar();
  }

  protected filtrar(campo: keyof FiltrosLogs, valor: string) {
    this.filtros.update((f) => ({ ...f, [campo]: valor }));
    this.cargar();
  }

  protected cargarMas() {
    const ultimo = this.registros().at(-1);
    if (ultimo) this.cargar(ultimo.fecha);
  }

  // fecha del ultimo registro mostrado 
  private cargar(antes?: string) {
    this.cargando.set(true);
    this.error.set(null);

    this.actividad.listar(this.filtros(), antes).subscribe({
      next: ({ registros, hayMas }) => {
        this.registros.update((lista) => (antes ? [...lista, ...registros] : registros));
        this.hayMas.set(hayMas);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
