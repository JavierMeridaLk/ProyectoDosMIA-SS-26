import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

// Agrega el token a cada peticion y cierra la sesion si el servidor responde 401
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        auth.cerrarSesion();
      }
      return throwError(() => error);
    }),
  );
};
