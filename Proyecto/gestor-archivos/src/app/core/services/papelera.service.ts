import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

import { API_URL } from '../config';
import { ElementoPapelera, RespuestaPapelera } from '../models/papelera.model';

@Injectable({ providedIn: 'root' })
export class PapeleraService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/papelera`;

  // Une carpetas y documentos
  listar() {
    return this.http.get<RespuestaPapelera>(this.url).pipe(
      map(({ carpetas, documentos }): ElementoPapelera[] =>
        [
          ...carpetas.map((c) => ({
            tipo: 'carpetas' as const,
            _id: c._id,
            nombre: c.nombre,
            ubicacion: c.ubicacion,
            fecha: c.eliminacion.fecha,
            tamano: null,
          })),
          ...documentos.map((d) => ({
            tipo: 'documentos' as const,
            _id: d._id,
            nombre: `${d.nombre}.${d.extension}`,
            ubicacion: d.ubicacion,
            fecha: d.eliminacion.fecha,
            tamano: d.tamano,
          })),
        ].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '')),
      ),
    );
  }

  // Devuelve el nombre de la carpeta donde quedo restaurado
  restaurar(elemento: ElementoPapelera) {
    return this.http
      .post<{ ubicacion: string }>(`${this.url}/${elemento.tipo}/${elemento._id}/restaurar`, {})
      .pipe(map((r) => r.ubicacion));
  }

  eliminarDefinitivo(elemento: ElementoPapelera) {
    return this.http.delete(`${this.url}/${elemento.tipo}/${elemento._id}`);
  }
}
