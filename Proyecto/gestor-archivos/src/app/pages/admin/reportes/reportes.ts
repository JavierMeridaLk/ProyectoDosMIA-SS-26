import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icono } from '../../../shared/icono/icono';


@Component({
  selector: 'app-reportes',
  imports: [Icono],
  styleUrl: '../logs/logs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cabecera">
      <h2>Reportes</h2>
      <p>Estadísticas de archivos, usuarios, compartición y actividad.</p>
    </div>
    <div class="vacio">
      <app-icono nombre="reportes" [tamano]="44" />
      <h3>Próximamente</h3>
    </div>
  `,
})
export class Reportes {}
