import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { API_URL } from '../config';
import { LoginDatos, RegistroDatos, RespuestaAuth, Usuario } from '../models/usuario.model';

const CLAVE_SESION = 'sesion';

interface Sesion {
  token: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly sesion = signal<Sesion | null>(this.leerSesion());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'ADMIN');

  login(datos: LoginDatos) {
    return this.http
      .post<RespuestaAuth>(`${API_URL}/auth/login`, datos)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  registro(datos: RegistroDatos) {
    return this.http
      .post<RespuestaAuth>(`${API_URL}/auth/registro`, datos)
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  // Trae los datos actualizados 
  refrescarPerfil() {
    return this.http.get<{ usuario: Usuario }>(`${API_URL}/auth/perfil`).pipe(
      tap(({ usuario }) => {
        const actual = this.sesion();
        if (actual) {
          this.guardarSesion({ ...actual, usuario });
        }
      }),
    );
  }

  cerrarSesion() {
    if (this.esNavegador) {
      localStorage.removeItem(CLAVE_SESION);
    }
    this.sesion.set(null);
    this.router.navigate(['/login']);
  }

  token() {
    return this.sesion()?.token ?? null;
  }

  private guardarSesion(sesion: Sesion) {
    if (this.esNavegador) {
      localStorage.setItem(CLAVE_SESION, JSON.stringify({ token: sesion.token, usuario: sesion.usuario }));
    }
    this.sesion.set({ token: sesion.token, usuario: sesion.usuario });
  }

  private leerSesion(): Sesion | null {
    if (!this.esNavegador) return null;
    const guardada = localStorage.getItem(CLAVE_SESION);
    try {
      return guardada ? JSON.parse(guardada) : null;
    } catch {
      return null;
    }
  }
}
