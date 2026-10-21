import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { Icono } from '../../shared/icono/icono';

@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink, Icono],
  templateUrl: './no-encontrada.html',
  styleUrl: './no-encontrada.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoEncontrada {
  protected readonly auth = inject(AuthService);
}
