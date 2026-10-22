export type TipoRecursoLog = 'DOCUMENTO' | 'CARPETA' | 'USUARIO';

export interface RegistroActividad {
  _id: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: string;
  recurso: { id: string; tipo: TipoRecursoLog; nombre: string };
  propietarioId: string | null;
  detalle: string | null;
  fecha: string;
  propio: boolean;
}

// Texto de cada accion 
export const ACCIONES: Record<string, string> = {
  REGISTRO: 'Se registró',
  INICIO_SESION: 'Inició sesión',
  CREAR_CARPETA: 'Creó la carpeta',
  CREAR_DOCUMENTO: 'Creó el documento',
  SUBIR_DOCUMENTO: 'Subió',
  EDITAR_DOCUMENTO: 'Editó',
  DESCARGAR_DOCUMENTO: 'Descargó',
  COMENTAR: 'Comentó en',
  RENOMBRAR: 'Renombró',
  MOVER: 'Movió',
  ELIMINAR: 'Envió a la papelera',
  RESTAURAR: 'Restauró',
  ELIMINAR_DEFINITIVO: 'Eliminó definitivamente',
  COMPARTIR: 'Compartió',
  CAMBIAR_PERMISO: 'Cambió el permiso de',
  RETIRAR_PERMISO: 'Retiró el acceso a',
  CAMBIAR_ROL: 'Cambió el rol de',
  CAMBIAR_ALMACENAMIENTO: 'Cambió el espacio de',
  ACTIVAR_USUARIO: 'Activó a',
  DESACTIVAR_USUARIO: 'Desactivó a',
};
