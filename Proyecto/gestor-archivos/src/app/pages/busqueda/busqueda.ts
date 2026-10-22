import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { BusquedaService } from '../../core/services/busqueda.service';
import { UnidadService } from '../../core/services/unidad.service';
import { FiltrosBusqueda, ResultadoBusqueda, TipoBusqueda } from '../../core/models/busqueda.model';
import { mensajeDeError } from '../../core/mensaje-error';
import { Icono } from '../../shared/icono/icono';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';

// Resultados de la barra de busqueda
@Component({
  selector: 'app-busqueda',
  imports: [Icono, BytesPipe, DatePipe],
  templateUrl: './busqueda.html',
  styleUrl: './busqueda.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Busqueda {
  private readonly busqueda = inject(BusquedaService);
  private readonly unidad = inject(UnidadService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  // Parametros de la URL
  readonly q = input<string>();
  readonly tipo = input<TipoBusqueda>();
  readonly desde = input<string>();
  readonly hasta = input<string>();
  readonly autor = input<string>();

  protected readonly filtros = computed<FiltrosBusqueda>(() => ({
    q: this.q() ?? '',
    tipo: this.tipo() ?? 'todos',
    desde: this.desde() ?? '',
    hasta: this.hasta() ?? '',
    autor: this.autor() ?? '',
  }));

  protected readonly hayFiltros = computed(() => {
    const { tipo, desde, hasta, autor } = this.filtros();
    return tipo !== 'todos' || !!desde || !!hasta || !!autor;
  });

  protected readonly hayCriterio = computed(() => !!this.filtros().q.trim() || this.hayFiltros());

  protected readonly resultados = signal<ResultadoBusqueda[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  private busquedaActual?: Subscription;

  constructor() {
    this.unidad.carpetaActualId.set(null);

    effect(() => {
      const filtros = this.filtros();
      const buscar = this.hayCriterio();
      untracked(() => (buscar ? this.buscar(filtros) : this.resultados.set([])));
    });
  }

  // Cada filtro se guarda en la URL
  protected filtrar(campo: keyof FiltrosBusqueda, valor: string) {
    const vacio = !valor || (campo === 'tipo' && valor === 'todos');
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { [campo]: vacio ? null : valor },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected limpiarFiltros() {
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { tipo: null, desde: null, hasta: null, autor: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected abrir(resultado: ResultadoBusqueda) {
    this.router.navigate([resultado.tipo === 'carpeta' ? '/carpetas' : '/documentos', resultado._id]);
  }

  private buscar(filtros: FiltrosBusqueda) {
    this.busquedaActual?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.busquedaActual = this.busqueda.buscar(filtros).subscribe({
      next: (resultados) => {
        this.resultados.set(resultados);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.resultados.set([]);
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
