import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

import { API_URL } from '../config';

export type FilaReporte = Record<string, string | number | null>;

// cada uno es un endpoint distinto que devuelve
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/reportes`;

  obtener(endpoint: string, parametros: Record<string, string>) {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(parametros)) {
      if (valor) params = params.set(clave, valor);
    }
    return this.http
      .get<{ filas: FilaReporte[] }>(`${this.url}/${endpoint}`, { params })
      .pipe(map((r) => r.filas));
  }
}
