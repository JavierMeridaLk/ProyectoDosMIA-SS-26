import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { ComparticionesService } from '../../core/services/comparticiones.service';
import { UnidadService } from '../../core/services/unidad.service';
import { ETIQUETAS_PERMISO, RecursoCompartido } from '../../core/models/comparticion.model';
import { mensajeDeError } from '../../core/mensaje-error';
import { Icono } from '../../shared/icono/icono';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';

// Recursos que otros usuarios compartieron conmigo
@Component({
  selector: 'app-compartidos',
  imports: [Icono, BytesPipe, DatePipe],
  templateUrl: './compartidos.html',
  styleUrl: './compartidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Compartidos implements OnInit {
  private readonly comparticiones = inject(ComparticionesService);
  private readonly unidad = inject(UnidadService);
  private readonly router = inject(Router);

  protected readonly etiquetas = ETIQUETAS_PERMISO;
  protected readonly recursos = signal<RecursoCompartido[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    // Lo que se cree desde la barra lateral estando aqui va a Mi Unidad
    this.unidad.carpetaActualId.set(null);
    this.unidad.vistaPropia.set(false);

    this.comparticiones.conmigo().subscribe({
      next: (recursos) => {
        this.recursos.set(recursos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected abrir(recurso: RecursoCompartido) {
    this.router.navigate([recurso.tipo === 'carpeta' ? '/carpetas' : '/documentos', recurso._id]);
  }
}
