import { inject, Injectable, signal } from '@angular/core';

import { DocumentosService } from './documentos.service';

export interface Aviso {
  tipo: 'exito' | 'error';
  texto: string;
}


@Injectable({ providedIn: 'root' })
export class UnidadService {
  private readonly documentos = inject(DocumentosService);

  // Carpeta que se esta viendo, ahi se crean y suben los documentos
  readonly carpetaActualId = signal<string | null>(null);
  // false cuando se esta viendo una carpeta que otro usuario compartio
  readonly vistaPropia = signal(true);
  readonly usado = signal(0);
 
  readonly version = signal(0);
  readonly aviso = signal<Aviso | null>(null);

  private temporizador?: ReturnType<typeof setTimeout>;

  recargarContenido() {
    this.version.update((v) => v + 1);
  }

  cargarUso() {
    this.documentos.almacenamiento().subscribe({
      next: ({ usado }) => this.usado.set(usado),
      error: () => {},
    });
  }

  // Mensaje temporal en la parte inferior de la pantalla
  avisar(texto: string, tipo: Aviso['tipo'] = 'exito') {
    clearTimeout(this.temporizador);
    this.aviso.set({ tipo, texto });
    this.temporizador = setTimeout(() => this.aviso.set(null), 4000);
  }
}
