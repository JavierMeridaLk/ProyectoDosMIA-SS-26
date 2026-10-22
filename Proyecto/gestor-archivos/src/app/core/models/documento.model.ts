export type Extension = 'txt' | 'md';

export interface Comentario {
  _id: string;
  usuarioId: string;
  usuarioNombre: string;
  texto: string;
  fecha: string;
}

export interface Documento {
  _id: string;
  nombre: string;
  extension: Extension;
  tamano: number;
  propietarioId: string;
  carpetaId: string | null;
  fechaCarga: string;
  fechaModificacion: string;
  comentarios?: Comentario[];
}

export interface Almacenamiento {
  usado: number;
  total: number;
}
