
export type Formato =
  | 'texto'
  | 'numero'
  | 'bytes'
  | 'fechaHora'
  | 'accion'
  | 'permiso'
  | 'tipoRecurso'
  | 'porcentaje'
  | 'periodo';

export type Parametro = 'rango' | 'usuario' | 'periodo';

export interface Columna {
  clave: string;
  titulo: string;
  formato?: Formato;
}

export interface Reporte {
  id: string; 
  titulo: string;
  parametros: Parametro[];
  columnas: Columna[];
}

export interface GrupoReportes {
  id: string;
  titulo: string;
  reportes: Reporte[];
}

export const GRUPOS: GrupoReportes[] = [
  {
    id: 'archivos',
    titulo: 'Archivos y almacenamiento',
    reportes: [
      {
        id: 'archivos-por-tipo',
        titulo: 'Archivos por tipo',
        parametros: [],
        columnas: [
          { clave: 'tipo', titulo: 'Tipo' },
          { clave: 'activos', titulo: 'Archivos', formato: 'numero' },
          { clave: 'enPapelera', titulo: 'En papelera', formato: 'numero' },
          { clave: 'cantidad', titulo: 'Total', formato: 'numero' },
        ],
      },
      {
        id: 'archivos-por-fecha',
        titulo: 'Archivos por rango de fechas',
        parametros: ['rango'],
        columnas: [
          { clave: 'nombre', titulo: 'Archivo' },
          { clave: 'tipo', titulo: 'Tipo' },
          { clave: 'propietario', titulo: 'Propietario' },
          { clave: 'tamano', titulo: 'Tamaño', formato: 'bytes' },
          { clave: 'fechaCarga', titulo: 'Fecha de carga', formato: 'fechaHora' },
        ],
      },
      {
        id: 'archivos-mas-operaciones',
        titulo: 'Archivos con más operaciones',
        parametros: [],
        columnas: [
          { clave: 'nombre', titulo: 'Archivo' },
          { clave: 'propietario', titulo: 'Propietario' },
          { clave: 'operaciones', titulo: 'Operaciones', formato: 'numero' },
          { clave: 'ultima', titulo: 'Última operación', formato: 'fechaHora' },
          { clave: 'estado', titulo: 'Estado' },
        ],
      },
    ],
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    reportes: [
      {
        id: 'top-usuarios-archivos',
        titulo: 'Top 10 usuarios con más archivos',
        parametros: [],
        columnas: [
          { clave: 'usuario', titulo: 'Usuario' },
          { clave: 'correo', titulo: 'Correo' },
          { clave: 'archivos', titulo: 'Archivos', formato: 'numero' },
          { clave: 'tamano', titulo: 'Espacio', formato: 'bytes' },
        ],
      },
      {
        id: 'usuarios-mas-comparten',
        titulo: 'Usuarios que más comparten',
        parametros: [],
        columnas: [
          { clave: 'usuario', titulo: 'Usuario' },
          { clave: 'recursos', titulo: 'Recursos compartidos', formato: 'numero' },
          { clave: 'comparticiones', titulo: 'Cantidad', formato: 'numero' },
        ],
      },
    ],
  },
  {
    id: 'comparticion',
    titulo: 'Compartición',
    reportes: [
      {
        id: 'archivos-mas-compartidos',
        titulo: 'Archivos más compartidos',
        parametros: [],
        columnas: [
          { clave: 'nombre', titulo: 'Archivo' },
          { clave: 'propietario', titulo: 'Propietario' },
          { clave: 'usuarios', titulo: 'Usuarios con acceso', formato: 'numero' },
        ],
      },
      {
        id: 'compartidos-por-usuario',
        titulo: 'Recursos compartidos por un usuario',
        parametros: ['usuario'],
        columnas: [
          { clave: 'recurso', titulo: 'Recurso' },
          { clave: 'tipo', titulo: 'Tipo', formato: 'tipoRecurso' },
          { clave: 'compartidoCon', titulo: 'Compartido con' },
          { clave: 'permiso', titulo: 'Permiso', formato: 'permiso' },
          { clave: 'fecha', titulo: 'Fecha', formato: 'fechaHora' },
        ],
      },
      {
        id: 'recibidos-por-usuario',
        titulo: 'Recursos recibidos por un usuario',
        parametros: ['usuario'],
        columnas: [
          { clave: 'recurso', titulo: 'Recurso' },
          { clave: 'tipo', titulo: 'Tipo', formato: 'tipoRecurso' },
          { clave: 'propietario', titulo: 'Compartido por' },
          { clave: 'permiso', titulo: 'Permiso', formato: 'permiso' },
          { clave: 'fecha', titulo: 'Fecha', formato: 'fechaHora' },
        ],
      },
    ],
  },
  {
    id: 'actividad',
    titulo: 'Actividad',
    reportes: [
      {
        id: 'actividad-usuario',
        titulo: 'Historial de un usuario',
        parametros: ['usuario', 'rango'],
        columnas: [
          { clave: 'accion', titulo: 'Acción', formato: 'accion' },
          { clave: 'tipo', titulo: 'Tipo', formato: 'tipoRecurso' },
          { clave: 'recurso', titulo: 'Recurso' },
          { clave: 'detalle', titulo: 'Detalle' },
          { clave: 'fecha', titulo: 'Fecha', formato: 'fechaHora' },
        ],
      },
      {
        id: 'operaciones-por-tipo',
        titulo: 'Operaciones por tipo de recurso',
        parametros: ['rango'],
        columnas: [
          { clave: 'tipo', titulo: 'Recurso', formato: 'tipoRecurso' },
          { clave: 'operaciones', titulo: 'Operaciones', formato: 'numero' },
        ],
      },
      {
        id: 'operaciones-por-periodo',
        titulo: 'Operaciones por período',
        parametros: ['periodo', 'rango'],
        columnas: [
          { clave: 'periodo', titulo: 'Período', formato: 'periodo' },
          { clave: 'operaciones', titulo: 'Operaciones', formato: 'numero' },
        ],
      },
      {
        id: 'principales-acciones',
        titulo: 'Principales acciones',
        parametros: ['rango'],
        columnas: [
          { clave: 'accion', titulo: 'Acción', formato: 'accion' },
          { clave: 'usuarios', titulo: 'Usuarios', formato: 'numero' },
          { clave: 'cantidad', titulo: 'Cantidad', formato: 'numero' },
          { clave: 'porcentaje', titulo: 'Porcentaje', formato: 'porcentaje' },
        ],
      },
    ],
  },
];
