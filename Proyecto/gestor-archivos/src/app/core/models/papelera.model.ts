import { Carpeta } from './carpeta.model';
import { Documento } from './documento.model';

export type TipoElemento = 'carpetas' | 'documentos';

export interface Eliminacion {
  enPapelera: boolean;
  fecha: string | null;
  origenId: string | null;
}

// cada elemento trae la ubicacion a la que regresaria
export interface RespuestaPapelera {
  carpetas: (Carpeta & { eliminacion: Eliminacion; ubicacion: string })[];
  documentos: (Documento & { eliminacion: Eliminacion; ubicacion: string })[];
}

// Carpetas y documentos juntos en una sola lista para la vista
export interface ElementoPapelera {
  tipo: TipoElemento;
  _id: string;
  nombre: string;
  ubicacion: string;
  fecha: string | null;
  tamano: number | null;
}
