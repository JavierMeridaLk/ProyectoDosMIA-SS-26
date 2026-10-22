import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { API_URL } from '../config';
import { RegistroActividad } from '../models/actividad.model';

export interface FiltrosLogs {
  usuario: string;
  accion: string;
  tipo: string; 
  desde: string; 
  hasta: string; 
}

// Historial de actividad del sistema 
@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/actividad`;

  listar(filtros: FiltrosLogs, antes?: string) {
    let params = new HttpParams();
    if (filtros.usuario.trim()) params = params.set('usuario', filtros.usuario.trim());
    if (filtros.accion) params = params.set('accion', filtros.accion);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.desde) params = params.set('desde', new Date(`${filtros.desde}T00:00:00`).toISOString());
    if (filtros.hasta) params = params.set('hasta', new Date(`${filtros.hasta}T23:59:59.999`).toISOString());
    if (antes) params = params.set('antes', antes);
    return this.http.get<{ registros: RegistroActividad[]; hayMas: boolean }>(this.url, { params });
  }
}
