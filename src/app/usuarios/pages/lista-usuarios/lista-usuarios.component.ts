import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../models/usuario.model';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioFormDialogComponent } from '../../components/usuario-form-dialog/usuario-form-dialog.component';
import { EditarUsuarioDialogComponent } from '../../components/editar-usuario-dialog/editar-usuario-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmarEstadoDialogComponent } from '../../components/confirmar-estado-dialog/confirmar-estado-dialog.component';




@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.css'
})
export class ListaUsuariosComponent implements OnInit {


  displayedColumns: string[] = [
    'usuario',
    'email',
    'role',
    'estado',
    'acciones'
  ];

  private snackBar = inject(MatSnackBar);
  private usuariosService = inject(UsuariosService);
  private dialog = inject(MatDialog);

  usuarios: Usuario[] = [];
  cargando = false;
  error = '';

  constructor(
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {

    this.cargando = true;
    this.error = '';

    this.usuariosService.getUsuarios().subscribe({

      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargando = false;
      },

      error: (error) => {
        console.error('Error al cargar usuarios:', error);

        this.error = 'No fue posible cargar los usuarios.';
        this.cargando = false;
      }

    });
  }

  abrirNuevoUsuario(): void {

    const dialogRef = this.dialog.open(
      UsuarioFormDialogComponent,
      {
        width: '520px',
        maxWidth: '95vw',
        disableClose: true
      }
    );

    dialogRef.afterClosed().subscribe((creado) => {

      if (creado) {
        this.cargarUsuarios();
      }

    });
  }

  //editar usuario

  editarUsuario(usuario: Usuario): void {
    const dialogRef = this.dialog.open(
      EditarUsuarioDialogComponent,
      {
        width: '520px',
        maxWidth: '95vw',
        disableClose: true,
        data: usuario
      }
    );

    dialogRef.afterClosed().subscribe(
      actualizado => {

        if (actualizado) {
          this.cargarUsuarios();
        }

      }
    );
  }

  cambiarEstado(usuario: Usuario): void {

  const dialogRef = this.dialog.open(
    ConfirmarEstadoDialogComponent,
    {
      width: '460px',
      maxWidth: '95vw',

      data: {
        nombre: usuario.nombre || usuario.email,
        activo: usuario.activo
      }
    }
  );

  dialogRef.afterClosed().subscribe(confirmado => {

    if (!confirmado) {
      return;
    }

    this.actualizarEstado(usuario);

  });
}

private actualizarEstado(usuario: Usuario): void {

  const nuevoEstado = !usuario.activo;

  this.usuariosService
    .actualizarEstadoUsuario(
      usuario._id,
      nuevoEstado
    )
    .subscribe({

      next: () => {

        usuario.activo = nuevoEstado;

        this.snackBar.open(
          nuevoEstado
            ? 'Usuario activado correctamente'
            : 'Usuario desactivado correctamente',
          'Cerrar',
          {
            duration: 3000
          }
        );

      },

      error: (error) => {

        this.snackBar.open(
          error?.error?.message ||
          'No fue posible actualizar el estado del usuario',
          'Cerrar',
          {
            duration: 4000
          }
        );

      }

    });
}
}
