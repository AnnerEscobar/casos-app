import {
  Component,
  inject
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  MatSnackBar
} from '@angular/material/snack-bar';

import {
  RegistroPendiente
} from '../../models/registro-pendiente.model';

import {
  AutorizacionesService
} from '../../services/autorizaciones.service';


@Component({
  selector: 'app-detalle-registro-dialog',

  standalone: true,

  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],

  templateUrl:
    './detalle-registro-dialog.component.html',

  styleUrl:
    './detalle-registro-dialog.component.css'
})
export class DetalleRegistroDialogComponent {

  registro =
    inject<RegistroPendiente>(MAT_DIALOG_DATA);

  private dialogRef =
    inject(MatDialogRef<DetalleRegistroDialogComponent>);

  private autorizacionesService =
    inject(AutorizacionesService);

  private snackBar =
    inject(MatSnackBar);


  archivoSeleccionado: File | null = null;

  procesando = false;


  cerrar(): void {
    this.dialogRef.close(false);
  }


  seleccionarArchivo(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }


    if (
      file.type !== 'application/pdf'
    ) {

      this.snackBar.open(
        'Selecciona un archivo PDF',
        'Cerrar',
        {
          duration: 3000
        }
      );

      input.value = '';

      return;
    }


    this.archivoSeleccionado = file;
  }


  quitarArchivo(): void {

    this.archivoSeleccionado = null;
  }


  reenviar(): void {

    if (!this.archivoSeleccionado) {

      this.snackBar.open(
        'Debes seleccionar el documento corregido',
        'Cerrar',
        {
          duration: 3000
        }
      );

      return;
    }


    this.procesando = true;


    this.autorizacionesService
      .reenviarRegistro(
        this.registro,
        this.archivoSeleccionado
      )
      .subscribe({

        next: () => {

          this.snackBar.open(
            'Documento corregido enviado para revisión',
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
            'No fue posible reenviar el registro',
            'Cerrar',
            {
              duration: 4000
            }
          );
        }

      });
  }


  nombreRevisor(): string {

    const revisor =
      this.registro.caso.revisadoPor;

    if (
      revisor &&
      typeof revisor === 'object'
    ) {

      return (
        revisor.nombre ||
        revisor.email ||
        'Analista'
      );
    }

    return 'Analista';
  }
}