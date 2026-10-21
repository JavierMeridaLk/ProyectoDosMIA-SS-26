export type Rol = 'ADMIN' | 'USUARIO';

export interface Usuario {
  _id: string;
  user: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  almacenamiento: number;
  fechaCreacion: string;
}

export interface LoginDatos {
  user: string;
  contrasena: string;
}

export interface RegistroDatos {
  correo: string;
  user: string;
  contrasena: string;
  confirmacion: string;
}

export interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}
