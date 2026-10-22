import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

import { API_URL } from '../config';
import {
  Comparticion,
  Permiso,
  RecursoCompartido,
  ResultadoCompartir,
  TipoRecurso,
  UsuarioResumen,
} from '../models/comparticion.model';

@Injectable({ providedIn: 'root' })
export class ComparticionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/comparticiones`;

  listarDeRecurso(tipo: TipoRecurso, id: string) {
    return this.http
      .get<{ comparticiones: Comparticion[] }>(`${this.url}/${tipo}/${id}`)
      .pipe(map((r) => r.comparticiones));
  }

  // usuarios: nombres de usuario o correos
  compartir(tipo: TipoRecurso, recursoId: string, usuarios: string[], permiso: Permiso) {
    return this.http.post<ResultadoCompartir>(this.url, { tipo, recursoId, usuarios, permiso });
  }

  cambiarPermiso(id: string, permiso: Permiso) {
    return this.http.patch(`${this.url}/${id}`, { permiso });
  }

  retirar(id: string) {
    return this.http.delete(`${this.url}/${id}`);
  }

  conmigo() {
    return this.http
      .get<{ recursos: RecursoCompartido[] }>(`${this.url}/conmigo`)
      .pipe(map((r) => r.recursos));
  }

  sugerirUsuarios(q: string) {
    return this.http
      .get<{ usuarios: UsuarioResumen[] }>(`${this.url}/usuarios`, { params: new HttpParams().set('q', q) })
      .pipe(map((r) => r.usuarios));
  }
}
