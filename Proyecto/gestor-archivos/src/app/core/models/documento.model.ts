export type Extension = 'txt' | 'md';

export interface Documento {
  _id: string;
  nombre: string;
  extension: Extension;
  tamano: number;
  propietarioId: string;
  carpetaId: string | null;
  fechaCarga: string;
  fechaModificacion: string;
}

export interface Almacenamiento {
  usado: number;
  total: number;
}
