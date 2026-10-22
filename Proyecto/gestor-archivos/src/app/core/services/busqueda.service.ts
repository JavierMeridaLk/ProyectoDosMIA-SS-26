import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

import { API_URL } from '../config';
import { FiltrosBusqueda, ResultadoBusqueda } from '../models/busqueda.model';

@Injectable({ providedIn: 'root' })
export class BusquedaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/busqueda`;

  buscar(filtros: FiltrosBusqueda) {
    let params = new HttpParams().set('tipo', filtros.tipo);
    if (filtros.q.trim()) params = params.set('q', filtros.q.trim());
    if (filtros.autor.trim()) params = params.set('autor', filtros.autor.trim());
    // Las fechas del input son dias locales: desde el inicio del dia hasta el final del dia
    if (filtros.desde) params = params.set('desde', new Date(`${filtros.desde}T00:00:00`).toISOString());
    if (filtros.hasta) params = params.set('hasta', new Date(`${filtros.hasta}T23:59:59.999`).toISOString());

    return this.http
      .get<{ resultados: ResultadoBusqueda[] }>(this.url, { params })
      .pipe(map((r) => r.resultados));
  }
}
