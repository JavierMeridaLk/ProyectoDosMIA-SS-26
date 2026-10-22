import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ComparticionesService } from '../../../core/services/comparticiones.service';
import {
  Comparticion,
  ETIQUETAS_PERMISO,
  Permiso,
  PERMISOS,
  TipoRecurso,
  UsuarioResumen,
} from '../../../core/models/comparticion.model';
import { mensajeDeError } from '../../../core/mensaje-error';
import { Icono } from '../../../shared/icono/icono';

@Component({
  selector: 'app-compartir',
  imports: [Icono],
  templateUrl: './compartir.html',
  styleUrls: ['../../../shared/dialogo.css', './compartir.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
})
export class Compartir implements OnInit {
  private readonly comparticiones = inject(ComparticionesService);

  readonly tipo = input.required<TipoRecurso>();
  readonly recursoId = input.required<string>();
  readonly nombre = input.required<string>();
  readonly cerrar = output<void>();

  protected readonly permisos = PERMISOS;
  protected readonly etiquetas = ETIQUETAS_PERMISO;

  // Usuarios a los que se va a compartir
  protected readonly destinatarios = signal<string[]>([]);
  protected readonly permiso = signal<Permiso>('LECTURA');
  protected readonly sugerencias = signal<UsuarioResumen[]>([]);

  protected readonly conAcceso = signal<Comparticion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => this.campo().nativeElement.focus());
  }

  ngOnInit() {
    this.comparticiones.listarDeRecurso(this.tipo(), this.recursoId()).subscribe({
      next: (lista) => {
        this.conAcceso.set(lista);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  // Busca sugerencias mientras se escribe
  protected alEscribir(campo: HTMLInputElement) {
    if (campo.value.includes(',')) {
      campo.value.split(',').forEach((parte) => this.agregar(parte));
      campo.value = '';
      this.sugerencias.set([]);
      return;
    }
    clearTimeout(this.temporizador);
    const q = campo.value.trim();
    if (!q) {
      this.sugerencias.set([]);
      return;
    }
    this.temporizador = setTimeout(() => {
      this.comparticiones.sugerirUsuarios(q).subscribe({
        next: (usuarios) => this.sugerencias.set(usuarios),
        error: () => this.sugerencias.set([]),
      });
    }, 250);
  }

  protected alPresionarTecla(evento: KeyboardEvent, campo: HTMLInputElement) {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      this.agregar(campo.value);
      campo.value = '';
      this.sugerencias.set([]);
    } else if (evento.key === 'Backspace' && !campo.value) {
      this.destinatarios.update((lista) => lista.slice(0, -1));
    }
  }

  protected elegirSugerencia(usuario: UsuarioResumen) {
    this.agregar(usuario.user);
    this.campo().nativeElement.value = '';
    this.campo().nativeElement.focus();
    this.sugerencias.set([]);
  }

  protected quitarDestinatario(usuario: string) {
    this.destinatarios.update((lista) => lista.filter((u) => u !== usuario));
  }

  protected compartir() {
    // Lo que quedo escrito sin presionar 
    this.agregar(this.campo().nativeElement.value);
    this.campo().nativeElement.value = '';
    if (!this.destinatarios().length) {
      this.error.set('Escribe al menos un usuario o correo');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    this.exito.set(null);

    this.comparticiones
      .compartir(this.tipo(), this.recursoId(), this.destinatarios(), this.permiso())
      .subscribe({
        next: ({ compartidas, errores }) => {
          // Si ya tenia acceso se reemplaza su permiso en la lista
          this.conAcceso.update((lista) => [
            ...lista.filter((c) => !compartidas.some((n) => n._id === c._id)),
            ...compartidas,
          ]);
          this.exito.set(
            `Compartido con ${compartidas.map((c) => c.usuario?.user).join(', ')}`,
          );
          // Los que fallaron se quedan para poder corregirlos
          this.destinatarios.set(errores.map((e) => e.usuario));
          if (errores.length) {
            this.error.set(errores.map((e) => `${e.usuario}: ${e.mensaje}`).join(' · '));
          }
          this.enviando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeDeError(err));
          this.enviando.set(false);
        },
      });
  }

  protected cambiarPermiso(comparticion: Comparticion, permiso: Permiso) {
    this.comparticiones.cambiarPermiso(comparticion._id, permiso).subscribe({
      next: () =>
        this.conAcceso.update((lista) =>
          lista.map((c) => (c._id === comparticion._id ? { ...c, permiso } : c)),
        ),
      error: (err: HttpErrorResponse) => this.error.set(mensajeDeError(err)),
    });
  }

  protected retirar(comparticion: Comparticion) {
    this.comparticiones.retirar(comparticion._id).subscribe({
      next: () => this.conAcceso.update((lista) => lista.filter((c) => c._id !== comparticion._id)),
      error: (err: HttpErrorResponse) => this.error.set(mensajeDeError(err)),
    });
  }

  protected iniciales(usuario: string | undefined) {
    return (usuario ?? '?').slice(0, 2).toUpperCase();
  }

  private agregar(texto: string) {
    const usuario = texto.trim();
    if (usuario && !this.destinatarios().includes(usuario)) {
      this.destinatarios.update((lista) => [...lista, usuario]);
    }
  }
}
