import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UsuariosService } from '../../services/usuarios.service';
import { UserRole } from '../../../auth/enums/user-role.enum';

@Component({
  selector: 'app-usuario-form-dialog',
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
  templateUrl: './usuario-form-dialog.component.html',
  styleUrl: './usuario-form-dialog.component.css'
})
export class UsuarioFormDialogComponent {


  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private dialogRef = inject(MatDialogRef<UsuarioFormDialogComponent>);
  private snackBar = inject(MatSnackBar);

  guardando = false;

  roles = Object.values(UserRole);

  form = this.fb.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(3)
    ]],

    email: ['', [
      Validators.required,
      Validators.email
    ]],

    password: ['', [
      Validators.required,
      Validators.minLength(6)
    ]],

    role: ['', Validators.required]
  });

  constructor(
  ) { }

  guardar(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;

    const data = {
      nombre: this.form.value.nombre!,
      email: this.form.value.email!,
      password: this.form.value.password!,
      role: this.form.value.role!
    };

    this.usuariosService.crearUsuario(data).subscribe({

      next: () => {

        this.snackBar.open(
          'Usuario creado correctamente',
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
          error?.error?.message || 'No fue posible crear el usuario',
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
