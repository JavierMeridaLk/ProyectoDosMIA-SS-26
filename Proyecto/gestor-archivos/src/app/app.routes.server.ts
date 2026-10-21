import { RenderMode, ServerRoute } from '@angular/ssr';

// La sesion vive en el navegador (localStorage), por eso las rutas se renderizan en el cliente
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
