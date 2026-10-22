import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

import { API_URL } from '../config';
import { Rol, Usuario, UsuarioAdmin } from '../models/usuario.model';

// Administracion de usuarios 
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/usuarios`;

  listar() {
    return this.http.get<{ usuarios: UsuarioAdmin[] }>(this.url).pipe(map((r) => r.usuarios));
  }

  cambiarRol(id: string, rol: Rol) {
    return this.http.patch<{ usuario: Usuario }>(`${this.url}/${id}/rol`, { rol }).pipe(map((r) => r.usuario));
  }

  cambiarActivo(id: string, activo: boolean) {
    return this.http
      .patch<{ usuario: Usuario }>(`${this.url}/${id}/activo`, { activo })
      .pipe(map((r) => r.usuario));
  }

  // almacenamiento en bytes
  cambiarAlmacenamiento(id: string, almacenamiento: number) {
    return this.http
      .patch<{ usuario: Usuario }>(`${this.url}/${id}/almacenamiento`, { almacenamiento })
      .pipe(map((r) => r.usuario));
  }
}
