import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

import { API_URL } from '../config';
import { Carpeta, ContenidoCarpeta } from '../models/carpeta.model';

@Injectable({ providedIn: 'root' })
export class CarpetasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/carpetas`;

  // null = raiz 
  contenido(id: string | null) {
    return this.http.get<ContenidoCarpeta>(id ? `${this.url}/${id}/contenido` : `${this.url}/contenido`);
  }

  crear(nombre: string, padreId: string | null) {
    return this.http
      .post<{ carpeta: Carpeta }>(this.url, { nombre, padreId })
      .pipe(map((r) => r.carpeta));
  }
}
