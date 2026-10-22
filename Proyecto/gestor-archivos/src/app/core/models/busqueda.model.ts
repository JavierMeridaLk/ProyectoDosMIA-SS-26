import { Extension } from './documento.model';

export type TipoBusqueda = 'todos' | 'carpeta' | 'txt' | 'md';


export interface FiltrosBusqueda {
  q: string;
  tipo: TipoBusqueda;
  desde: string;
  hasta: string; 
  autor: string;
}

export interface ResultadoBusqueda {
  tipo: 'carpeta' | 'documento';
  _id: string;
  nombre: string;
  extension: Extension | null;
  tamano: number | null;
  fecha: string;
  autor: string;
  propio: boolean;
  ubicacion: string;
}
