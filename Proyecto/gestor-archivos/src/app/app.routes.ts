import { Routes } from '@angular/router';

import { authGuard, invitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/auth/auth').then((m) => m.Auth),
    title: 'Iniciar sesión · Gestor de Archivos',
  },
  {
    path: 'inicio',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
    title: 'Mi Unidad · Gestor de Archivos',
  },
  { path: '**', redirectTo: 'inicio' },
];
