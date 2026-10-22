import { DOCUMENT, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';

import { API_URL } from '../config';
import { Almacenamiento, Documento, Extension } from '../models/documento.model';

export const EXTENSIONES_PERMITIDAS = ['txt', 'md'];
export const TAMANO_MAXIMO = 5 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly url = `${API_URL}/documentos`;

  almacenamiento() {
    return this.http.get<Almacenamiento>(`${this.url}/almacenamiento`);
  }

  // carpetaId null = se crea en la raiz
  crear(nombre: string, extension: Extension, carpetaId: string | null) {
    return this.http
      .post<{ documento: Documento }>(this.url, { nombre, extension, carpetaId })
      .pipe(map((r) => r.documento));
  }

  subir(archivo: File, carpetaId: string | null) {
    const datos = new FormData();
    if (carpetaId) datos.append('carpetaId', carpetaId);
    datos.append('archivo', archivo);
    return this.http
      .post<{ documento: Documento }>(`${this.url}/subir`, datos)
      .pipe(map((r) => r.documento));
  }

  obtener(id: string) {
    return this.http.get<{ documento: Documento; contenido: string }>(`${this.url}/${id}`);
  }

  guardarContenido(id: string, contenido: string) {
    return this.http
      .put<{ documento: Documento }>(`${this.url}/${id}/contenido`, { contenido })
      .pipe(map((r) => r.documento));
  }

  // Se pide como blob  y se descarga con un enlace temporal
  descargar(documento: Documento) {
    return this.http.get(`${this.url}/${documento._id}/descargar`, { responseType: 'blob' }).pipe(
      tap((blob) => {
        const enlace = this.document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `${documento.nombre}.${documento.extension}`;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
      }),
    );
  }

  // Lo mueve a la papelera (no lo borra)
  eliminar(id: string) {
    return this.http.delete(`${this.url}/${id}`);
  }
}
