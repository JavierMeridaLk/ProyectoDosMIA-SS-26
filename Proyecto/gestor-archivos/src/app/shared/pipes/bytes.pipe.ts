import { Pipe, PipeTransform } from '@angular/core';

const UNIDADES = ['B', 'KB', 'MB', 'GB', 'TB'];

@Pipe({ name: 'bytes' })
export class BytesPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (!valor) return '0 B';
    const i = Math.min(Math.floor(Math.log(valor) / Math.log(1024)), UNIDADES.length - 1);
    const numero = valor / 1024 ** i;
    return `${Number.isInteger(numero) ? numero : numero.toFixed(1)} ${UNIDADES[i]}`;
  }
}
