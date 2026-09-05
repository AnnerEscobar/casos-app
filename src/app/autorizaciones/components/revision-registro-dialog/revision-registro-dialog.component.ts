import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

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

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  RegistroPendiente
} from '../../models/registro-pendiente.model';

import {
  AutorizacionesService
} from '../../services/autorizaciones.service';


@Component({
  selector: 'app-revision-registro-dialog',
  standalone: true,

  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],

  templateUrl:
    './revision-registro-dialog.component.html',

  styleUrl:
    './revision-registro-dialog.component.css'
})
export class RevisionRegistroDialogComponent {

  private fb = inject(FormBuilder);

  private dialogRef =
    inject(MatDialogRef<RevisionRegistroDialogComponent>);

  private autorizacionesService =
    inject(AutorizacionesService);

  private snackBar =
    inject(MatSnackBar);


  registro =
    inject<RegistroPendiente>(MAT_DIALOG_DATA);


  procesando = false;

  mostrandoRechazo = false;


  rechazoForm = this.fb.group({

    motivo: [
      '',
      [
        Validators.required,
        Validators.minLength(5)
      ]
    ]

  });


  cerrar(): void {
    this.dialogRef.close(false);
  }


  mostrarRechazo(): void {
    this.mostrandoRechazo = true;
  }


  cancelarRechazo(): void {

    this.mostrandoRechazo = false;

    this.rechazoForm.reset();
  }


  aprobar(): void {

    this.procesando = true;

    this.autorizacionesService
      .aprobarRegistro(this.registro)
      .subscribe({

        next: () => {

          this.snackBar.open(
            'Registro aprobado correctamente',
            'Cerrar',
            {
              duration: 3000
            }
          );

          this.dialogRef.close(true);
        },

        error: (error) => {

          this.procesando = false;

          this.snackBar.open(
            error?.error?.message ||
            'No fue posible aprobar el registro',
            'Cerrar',
            {
              duration: 4000
            }
          );
        }

      });
  }


  rechazar(): void {

    if (this.rechazoForm.invalid) {

      this.rechazoForm.markAllAsTouched();

      return;
    }


    this.procesando = true;


    this.autorizacionesService
      .rechazarRegistro(
        this.registro,
        this.rechazoForm.value.motivo!
      )
      .subscribe({

        next: () => {

          this.snackBar.open(
            'Registro rechazado',
            'Cerrar',
            {
              duration: 3000
            }
          );

          this.dialogRef.close(true);
        },

        error: (error) => {

          this.procesando = false;

          this.snackBar.open(
            error?.error?.message ||
            'No fue posible rechazar el registro',
            'Cerrar',
            {
              duration: 4000
            }
          );
        }

      });
  }


  nombreRegistrador(): string {

    const usuario =
      this.registro.registradoPor;

    if (
      usuario &&
      typeof usuario === 'object'
    ) {

      return (
        usuario.nombre ||
        usuario.email ||
        'Sin nombre'
      );
    }

    return 'Sin información';
  }
}