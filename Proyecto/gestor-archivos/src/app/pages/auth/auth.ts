import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { Icono } from '../../shared/icono/icono';

type Pestana = 'login' | 'registro';

// Valida a nivel de formulario que contrasena y confirmacion sean iguales
const contrasenasIguales = (grupo: AbstractControl): ValidationErrors | null => {
  const { contrasena, confirmacion } = grupo.value;
  return contrasena === confirmacion ? null : { noCoinciden: true };
};

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, Icono],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly pestana = signal<Pestana>('login');
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verContrasena = signal(false);

  protected readonly formLogin = this.fb.group({
    user: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  protected readonly formRegistro = this.fb.group(
    {
      correo: ['', [Validators.required, Validators.email]],
      user: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      contrasena: ['', [Validators.required, Validators.minLength(4)]],
      confirmacion: ['', Validators.required],
    },
    { validators: contrasenasIguales },
  );

  protected cambiarPestana(pestana: Pestana) {
    this.pestana.set(pestana);
    this.error.set(null);
    this.verContrasena.set(false);
  }

  protected invalido(form: FormGroup, campo: string) {
    const control = form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  protected iniciarSesion() {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }
    this.enviar(this.auth.login(this.formLogin.getRawValue()));
  }

  protected registrarse() {
    if (this.formRegistro.invalid) {
      this.formRegistro.markAllAsTouched();
      return;
    }
    this.enviar(this.auth.registro(this.formRegistro.getRawValue()));
  }

  private enviar(peticion: ReturnType<AuthService['login']>) {
    this.cargando.set(true);
    this.error.set(null);

    peticion.subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor'
            : (err.error?.mensaje ?? 'Ocurrió un error inesperado'),
        );
        this.cargando.set(false);
      },
    });
  }
}
