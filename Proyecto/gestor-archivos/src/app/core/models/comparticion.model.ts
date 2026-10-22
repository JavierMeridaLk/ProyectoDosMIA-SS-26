import { Extension } from './documento.model';

export type Permiso = 'LECTURA' | 'COMENTAR' | 'EDICION';
export type PermisoEfectivo = Permiso | 'PROPIETARIO';

export const PERMISOS: Permiso[] = ['LECTURA', 'COMENTAR', 'EDICION'];

export const ETIQUETAS_PERMISO: Record<PermisoEfectivo, string> = {
  LECTURA: 'Lectura',
  COMENTAR: 'Comentar',
  EDICION: 'Edición',
  PROPIETARIO: 'Propietario',
};

// Cada nivel incluye a los anteriores 
const NIVELES: Record<PermisoEfectivo, number> = { LECTURA: 1, COMENTAR: 2, EDICION: 3, PROPIETARIO: 4 };
export const tienePermiso = (permiso: PermisoEfectivo | null, minimo: PermisoEfectivo) =>
  !!permiso && NIVELES[permiso] >= NIVELES[minimo];

export type TipoRecurso = 'documentos' | 'carpetas';

export interface UsuarioResumen {
  _id: string;
  user: string;
  correo: string;
}

// Con quien esta compartido un recurso 
export interface Comparticion {
  _id: string;
  permiso: Permiso;
  fecha: string;
  usuario: UsuarioResumen | null;
}

export interface ResultadoCompartir {
  compartidas: Comparticion[];
  errores: { usuario: string; mensaje: string }[];
}

// Lo que otros compartieron conmigo
export interface RecursoCompartido {
  tipo: 'carpeta' | 'documento';
  _id: string;
  nombre: string;
  extension: Extension | null;
  tamano: number | null;
  permiso: Permiso;
  propietario: string;
  fecha: string;
}
