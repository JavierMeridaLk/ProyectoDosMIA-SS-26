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
  {
    path: 'carpetas/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
    title: 'Carpeta · Gestor de Archivos',
  },
  {
    path: 'documentos/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/editor/editor').then((m) => m.Editor),
    title: 'Editor · Gestor de Archivos',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/no-encontrada/no-encontrada').then((m) => m.NoEncontrada),
    title: 'Página no encontrada · Gestor de Archivos',
  },
];
