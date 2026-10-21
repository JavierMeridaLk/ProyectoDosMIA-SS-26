import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { Icono } from '../../shared/icono/icono';
import { BytesPipe } from '../../shared/pipes/bytes.pipe';

@Component({
  selector: 'app-inicio',
  imports: [Icono, BytesPipe, DatePipe],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'cerrarMenuSiEsFuera($event)',
    '(document:keydown.escape)': 'menuAbierto.set(false)',
  },
})
export class Inicio implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  protected readonly menuAbierto = signal(false);

  
  protected readonly usado = signal(0);

  protected readonly porcentajeUsado = computed(() => {
    const total = this.auth.usuario()?.almacenamiento ?? 0;
    return total ? Math.min(100, Math.round((this.usado() / total) * 100)) : 0;
  });

  protected readonly iniciales = computed(() =>
    (this.auth.usuario()?.user ?? '').slice(0, 2).toUpperCase(),
  );

  ngOnInit() {
    this.auth.refrescarPerfil().subscribe({ error: () => {} });
  }

  // Cierra el panel del usuario al hacer clic en cualquier parte fuera 
  protected cerrarMenuSiEsFuera(evento: MouseEvent) {
    const perfil = this.elemento.nativeElement.querySelector('.perfil');
    if (this.menuAbierto() && !perfil?.contains(evento.target as Node)) {
      this.menuAbierto.set(false);
    }
  }
}
