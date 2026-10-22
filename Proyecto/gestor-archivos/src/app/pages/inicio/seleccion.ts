import { TipoRecurso } from '../../core/models/comparticion.model';

// Carpeta o documento sobre el que se abrio una accion 
export interface Seleccion {
  tipo: TipoRecurso;
  id: string;
  nombre: string;
  extension: string | null;
  padreId: string | null;
}

export const nombreCompleto = (s: Seleccion) => (s.extension ? `${s.nombre}.${s.extension}` : s.nombre);
