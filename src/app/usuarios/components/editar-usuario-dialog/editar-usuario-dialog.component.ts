import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UsuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../models/usuario.model';
import { UserRole } from '../../../auth/enums/user-role.enum';

@Component({
  selector: 'app-editar-usuario-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './editar-usuario-dialog.component.html',
  styleUrl: './editar-usuario-dialog.component.css'
})
export class EditarUsuarioDialogComponent {

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private dialogRef =
    inject(MatDialogRef<EditarUsuarioDialogComponent>);

  private snackBar = inject(MatSnackBar);

  usuario = inject<Usuario>(MAT_DIALOG_DATA);

  guardando = false;

  roles = Object.values(UserRole);

  form = this.fb.group({
    nombre: [
      this.usuario.nombre ?? '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],

    role: [
      this.usuario.role,
      Validators.required
    ]
  });

  guardar(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;

    const data = {
      nombre: this.form.value.nombre!,
      role: this.form.value.role!
    };

    this.usuariosService
      .actualizarUsuario(this.usuario._id, data)
      .subscribe({

        next: () => {

          this.snackBar.open(
            'Usuario actualizado correctamente',
            'Cerrar',
            {
              duration: 3000
            }
          );

          this.dialogRef.close(true);
        },

        error: (error) => {

          this.guardando = false;

          this.snackBar.open(
            error?.error?.message ||
            'No fue posible actualizar el usuario',
            'Cerrar',
            {
              duration: 4000
            }
          );
        }
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
