import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

// Solo deja pasar a usuarios con sesion
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).autenticado() || inject(Router).createUrlTree(['/login']);
};

export const invitadoGuard: CanActivateFn = () => {
  return !inject(AuthService).autenticado() || inject(Router).createUrlTree(['/inicio']);
};
