import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ACCIONES, RegistroActividad } from '../../core/models/actividad.model';
import { Icono, NombreIcono } from '../icono/icono';

// Lista de registros del historial
@Component({
  selector: 'app-lista-actividad',
  imports: [Icono, DatePipe],
  templateUrl: './lista-actividad.html',
  styleUrl: './lista-actividad.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaActividad {
  readonly registros = input.required<RegistroActividad[]>();

  protected icono(registro: RegistroActividad): NombreIcono {
    return { DOCUMENTO: 'archivo', CARPETA: 'carpeta', USUARIO: 'usuario' }[registro.recurso.tipo] as NombreIcono;
  }

  // Texto de la accion 
  protected textoAccion(registro: RegistroActividad) {
    return (ACCIONES[registro.accion] ?? registro.accion).toLowerCase();
  }

  // Los registros de usuario 
  protected muestraRecurso(registro: RegistroActividad) {
    return !['REGISTRO', 'INICIO_SESION'].includes(registro.accion);
  }
}
