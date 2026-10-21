import { HttpErrorResponse } from '@angular/common/http';


export const mensajeDeError = (err: HttpErrorResponse) => {
  if (err.status === 0) return 'No se pudo conectar con el servidor';
  return err.error?.mensaje ?? 'Ocurrió un error inesperado';
};
