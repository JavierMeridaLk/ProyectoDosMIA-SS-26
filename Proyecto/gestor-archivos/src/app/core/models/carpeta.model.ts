import { Documento } from './documento.model';
import { PermisoEfectivo } from './comparticion.model';

export interface Carpeta {
  _id: string;
  nombre: string;
  propietarioId: string;
  padreId: string | null;
  ruta: string[];
  fechaCreacion: string;
}

// Antecesor para la barra de navegacion
export interface CarpetaEnRuta {
  _id: string;
  nombre: string;
}

export interface ContenidoCarpeta {
  carpeta: Carpeta | null;
  ruta: CarpetaEnRuta[];
  carpetas: Carpeta[];
  documentos: Documento[];
  permiso: PermisoEfectivo;
  propio: boolean;
}
