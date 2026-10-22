import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { UnidadService } from '../../../core/services/unidad.service';
import { Rol, Usuario, UsuarioAdmin } from '../../../core/models/usuario.model';
import { mensajeDeError } from '../../../core/mensaje-error';
import { Icono } from '../../../shared/icono/icono';
import { BytesPipe } from '../../../shared/pipes/bytes.pipe';

const GB = 1024 ** 3;

// todos los usuarios, su rol, estado y espacio
@Component({
  selector: 'app-usuarios',
  imports: [Icono, BytesPipe, DatePipe],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Usuarios implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly unidad = inject(UnidadService);

  protected readonly usuarios = signal<UsuarioAdmin[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly editandoEspacio = signal<string | null>(null);
  protected readonly procesandoId = signal<string | null>(null);

  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return texto
      ? this.usuarios().filter((u) => u.user.toLowerCase().includes(texto) || u.correo.includes(texto))
      : this.usuarios();
  });

  // Informacion global del sistema
  protected readonly resumen = computed(() => {
    const lista = this.usuarios();
    return {
      total: lista.length,
      activos: lista.filter((u) => u.activo).length,
      admins: lista.filter((u) => u.rol === 'ADMIN').length,
      usado: lista.reduce((suma, u) => suma + u.usado, 0),
      documentos: lista.reduce((suma, u) => suma + u.documentos, 0),
    };
  });

  ngOnInit() {
    this.unidad.carpetaActualId.set(null);
    this.unidad.vistaPropia.set(false);

    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  protected esYo(usuario: UsuarioAdmin) {
    return usuario._id === this.auth.usuario()?._id;
  }

  protected porcentaje(usuario: UsuarioAdmin) {
    return usuario.almacenamiento ? Math.min(100, Math.round((usuario.usado / usuario.almacenamiento) * 100)) : 0;
  }

  protected enGb(bytes: number) {
    return +(bytes / GB).toFixed(2);
  }

  protected cambiarRol(usuario: UsuarioAdmin, rol: Rol) {
    this.actualizar(usuario, this.usuariosService.cambiarRol(usuario._id, rol), `Ahora ${usuario.user} es ${rol === 'ADMIN' ? 'administrador' : 'usuario'}`);
  }

  protected cambiarActivo(usuario: UsuarioAdmin) {
    const activo = !usuario.activo;
    this.actualizar(
      usuario,
      this.usuariosService.cambiarActivo(usuario._id, activo),
      `${usuario.user} fue ${activo ? 'activado' : 'desactivado'}`,
    );
  }

  protected guardarEspacio(usuario: UsuarioAdmin, valor: string) {
    const gb = Number(valor);
    if (!Number.isFinite(gb) || gb < 0) {
      this.unidad.avisar('Escribe un espacio válido en GB', 'error');
      return;
    }
    this.actualizar(
      usuario,
      this.usuariosService.cambiarAlmacenamiento(usuario._id, Math.round(gb * GB)),
      `Espacio de ${usuario.user}: ${gb} GB`,
    );
  }

  // Aplica el cambio en el servidor y reemplaza al usuario en la lista conservando su espacio usado
  private actualizar(usuario: UsuarioAdmin, peticion: Observable<Usuario>, mensaje: string) {
    this.procesandoId.set(usuario._id);
    peticion.subscribe({
      next: (actualizado) => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u._id === usuario._id ? { ...u, ...actualizado } : u)),
        );
        this.procesandoId.set(null);
        this.editandoEspacio.set(null);
        this.unidad.avisar(mensaje);
      },
      error: (err: HttpErrorResponse) => {
        this.procesandoId.set(null);
        this.unidad.avisar(mensajeDeError(err), 'error');
        this.usuarios.update((lista) => [...lista]);
      },
    });
  }
}
