import { Routes } from '@angular/router';

import { adminGuard, authGuard, invitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/auth/auth').then((m) => m.Auth),
    title: 'Iniciar sesión · Gestor de Archivos',
  },
  {
  
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
        title: 'Mi Unidad · Gestor de Archivos',
      },
      {
        path: 'carpetas/:id',
        loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
        title: 'Carpeta · Gestor de Archivos',
      },
      {
        path: 'papelera',
        loadComponent: () => import('./pages/papelera/papelera').then((m) => m.Papelera),
        title: 'Papelera · Gestor de Archivos',
      },
      {
        path: 'compartidos',
        loadComponent: () => import('./pages/compartidos/compartidos').then((m) => m.Compartidos),
        title: 'Compartidos conmigo · Gestor de Archivos',
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'usuarios',
            loadComponent: () => import('./pages/admin/usuarios/usuarios').then((m) => m.Usuarios),
            title: 'Usuarios · Gestor de Archivos',
          },
          {
            path: 'logs',
            loadComponent: () => import('./pages/admin/logs/logs').then((m) => m.Logs),
            title: 'Logs · Gestor de Archivos',
          },
          {
            path: 'reportes',
            loadComponent: () => import('./pages/admin/reportes/reportes').then((m) => m.Reportes),
            title: 'Reportes · Gestor de Archivos',
          },
        ],
      },
      {
        path: 'buscar',
        loadComponent: () => import('./pages/busqueda/busqueda').then((m) => m.Busqueda),
        title: 'Búsqueda · Gestor de Archivos',
      },
    ],
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
