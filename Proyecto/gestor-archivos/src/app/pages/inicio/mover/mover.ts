import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CarpetasService } from '../../../core/services/carpetas.service';
import { DocumentosService } from '../../../core/services/documentos.service';
import { Carpeta } from '../../../core/models/carpeta.model';
import { mensajeDeError } from '../../../core/mensaje-error';
import { Icono } from '../../../shared/icono/icono';
import { nombreCompleto, Seleccion } from '../seleccion';

interface Destino {
  id: string | null; 
  nombre: string;
  nivel: number;
  permitido: boolean;
}

@Component({
  selector: 'app-mover',
  imports: [Icono],
  templateUrl: './mover.html',
  styleUrls: ['../../../shared/dialogo.css', './mover.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
})
export class Mover implements OnInit {
  private readonly carpetasService = inject(CarpetasService);
  private readonly documentos = inject(DocumentosService);

  readonly seleccion = input.required<Seleccion>();
  readonly movido = output<string>();
  readonly cerrar = output<void>();

  protected readonly nombre = computed(() => nombreCompleto(this.seleccion()));

  private readonly carpetas = signal<Pick<Carpeta, '_id' | 'nombre' | 'padreId' | 'ruta'>[]>([]);
  protected readonly elegido = signal<Destino | null>(null);
  protected readonly cargando = signal(true);
  protected readonly moviendo = signal(false);
  protected readonly error = signal<string | null>(null);

  // Mi Unidad + todas las carpetas en forma de arbol 
  protected readonly destinos = computed<Destino[]>(() => {
    const seleccion = this.seleccion();
    const carpetas = this.carpetas();
    const nombres = new Map(carpetas.map((c) => [c._id, c.nombre]));
    const rutaCompleta = (c: (typeof carpetas)[number]) =>
      [...c.ruta.map((id) => nombres.get(id) ?? ''), c.nombre].join('/');

    const ordenadas = [...carpetas].sort((a, b) => rutaCompleta(a).localeCompare(rutaCompleta(b), 'es'));

    return [
      { id: null, nombre: 'Mi Unidad', nivel: 0, permitido: seleccion.padreId !== null },
      ...ordenadas.map((c) => ({
        id: c._id,
        nombre: c.nombre,
        nivel: c.ruta.length + 1,
        // No se puede mover a donde ya esta
        permitido:
          c._id !== seleccion.padreId &&
          !(seleccion.tipo === 'carpetas' && (c._id === seleccion.id || c.ruta.includes(seleccion.id))),
      })),
    ];
  });

  ngOnInit() {
    this.carpetasService.arbol().subscribe({
      next: (carpetas) => {
        this.carpetas.set(carpetas);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected mover() {
    const destino = this.elegido();
    const seleccion = this.seleccion();
    if (!destino) return;

    this.moviendo.set(true);
    this.error.set(null);
    const peticion: Observable<unknown> =
      seleccion.tipo === 'carpetas'
        ? this.carpetasService.mover(seleccion.id, destino.id)
        : this.documentos.mover(seleccion.id, destino.id);

    peticion.subscribe({
      next: () => this.movido.emit(destino.nombre),
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.moviendo.set(false);
      },
    });
  }
}
