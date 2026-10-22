import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { FilaReporte, ReportesService } from '../../../core/services/reportes.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { UnidadService } from '../../../core/services/unidad.service';
import { UsuarioAdmin } from '../../../core/models/usuario.model';
import { ACCIONES } from '../../../core/models/actividad.model';
import { ETIQUETAS_PERMISO, PermisoEfectivo } from '../../../core/models/comparticion.model';
import { mensajeDeError } from '../../../core/mensaje-error';
import { Icono } from '../../../shared/icono/icono';
import { BytesPipe } from '../../../shared/pipes/bytes.pipe';
import { GRUPOS, Reporte } from './reportes.config';

type Periodo = 'dia' | 'semana' | 'mes';

const TIPOS_RECURSO: Record<string, string> = {
  DOCUMENTO: 'Documento',
  CARPETA: 'Carpeta',
  USUARIO: 'Usuario',
};

// reportes con agregaciones de MongoDB
@Component({
  selector: 'app-reportes',
  imports: [Icono, BytesPipe, DatePipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reportes implements OnInit {
  private readonly reportes = inject(ReportesService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly unidad = inject(UnidadService);

  protected readonly grupos = GRUPOS;
  protected readonly grupoId = signal(GRUPOS[0].id);
  protected readonly grupo = computed(() => GRUPOS.find((g) => g.id === this.grupoId())!);
  protected readonly reporte = signal<Reporte>(GRUPOS[0].reportes[0]);

  // Parametros
  protected readonly usuarios = signal<UsuarioAdmin[]>([]);
  protected readonly usuarioId = signal('');
  protected readonly desde = signal('');
  protected readonly hasta = signal('');
  protected readonly periodo = signal<Periodo>('dia');

  protected readonly filas = signal<FilaReporte[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  // Los reportes por usuario no se pueden generar hasta elegir uno
  protected readonly faltaUsuario = computed(
    () => this.reporte().parametros.includes('usuario') && !this.usuarioId(),
  );

  private consulta?: Subscription;

  constructor() {
    // Se genera el reporte cada vez que cambia el reporte elegido o alguno de sus parametros
    effect(() => {
      const reporte = this.reporte();
      const usa = (p: string) => reporte.parametros.includes(p as never);
      const parametros = {
        usuarioId: usa('usuario') ? this.usuarioId() : '',
        desde: usa('rango') && this.desde() ? new Date(`${this.desde()}T00:00:00`).toISOString() : '',
        hasta: usa('rango') && this.hasta() ? new Date(`${this.hasta()}T23:59:59.999`).toISOString() : '',
        periodo: usa('periodo') ? this.periodo() : '',
        zona: usa('periodo') ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
      };
      const falta = this.faltaUsuario();
      untracked(() => (falta ? this.limpiar() : this.generar(reporte, parametros)));
    });
  }

  ngOnInit() {
    this.unidad.carpetaActualId.set(null);
    this.unidad.vistaPropia.set(false);
    this.usuariosService.listar().subscribe({
      next: (usuarios) => this.usuarios.set([...usuarios].sort((a, b) => a.user.localeCompare(b.user))),
      error: () => {},
    });
  }

  protected elegirGrupo(id: string) {
    this.grupoId.set(id);
    this.reporte.set(this.grupo().reportes[0]);
  }

  protected texto(valor: unknown, formato: string | undefined): string {
    if (valor === null || valor === undefined || valor === '') return '—';
    switch (formato) {
      case 'accion':
        return ACCIONES[String(valor)] ?? String(valor);
      case 'permiso':
        return ETIQUETAS_PERMISO[valor as PermisoEfectivo] ?? String(valor);
      case 'tipoRecurso':
        return TIPOS_RECURSO[String(valor)] ?? String(valor);
      case 'porcentaje':
        return `${valor}%`;
      case 'numero':
        return Number(valor).toLocaleString('es');
      case 'periodo':
        return this.periodo() === 'semana' ? `Semana del ${valor}` : String(valor);
      default:
        return String(valor);
    }
  }

  // Columnas numericas alineadas a la derecha para comparar cantidades facilmente
  protected esNumerica(formato: string | undefined) {
    return formato === 'numero' || formato === 'bytes' || formato === 'porcentaje';
  }

  private generar(reporte: Reporte, parametros: Record<string, string>) {
    this.consulta?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.consulta = this.reportes.obtener(reporte.id, parametros).subscribe({
      next: (filas) => {
        this.filas.set(filas);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.filas.set([]);
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  private limpiar() {
    this.consulta?.unsubscribe();
    this.filas.set([]);
    this.cargando.set(false);
    this.error.set(null);
  }
}
