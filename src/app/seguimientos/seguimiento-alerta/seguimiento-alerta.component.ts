import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';

import {
  SeguimientoAlertaService
} from '../seguimiento-services/seguimiento-alerta.service';


@Component({
  selector: 'app-seguimiento-alerta',

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],

  templateUrl:
    './seguimiento-alerta.component.html',

  styleUrl:
    './seguimiento-alerta.component.css'
})
export default class SeguimientoAlertaComponent
  implements OnInit {

  seguimientoForm!: FormGroup;

  casoEncontrado: any = null;

  files: File[] = [];

  fileName: string | null = null;

  searching = false;

  submitting = false;


  estados = [
    {
      value: 'Informado',
      label: 'Informado'
    },
    {
      value: 'Remitido',
      label: 'Remitido'
    },
    {
      value: 'Concluido',
      label: 'Concluido'
    }
  ];


  constructor(
    private fb: FormBuilder,
    private sgicService: SeguimientoAlertaService,
    private snackBar: MatSnackBar,
  ) {}


  ngOnInit(): void {

    this.seguimientoForm =
      this.fb.group({

        numeroDeic: [
          '',
          Validators.required
        ],

        nuevoEstado: [
          '',
          Validators.required
        ],

        acompanante: [''],

        telefono: [''],

        direccion: [''],

      });


    this.seguimientoForm
      .get('nuevoEstado')
      ?.valueChanges
      .subscribe(
        estado => {

          const campos = [
            'acompanante',
            'telefono',
            'direccion'
          ];


          campos.forEach(
            campo => {

              const control =
                this.seguimientoForm.get(
                  campo
                );


              if (
                estado === 'Remitido'
              ) {

                control?.setValidators(
                  Validators.required
                );

              } else {

                control?.clearValidators();

                control?.setValue(
                  '',
                  {
                    emitEvent: false
                  }
                );

              }


              control
                ?.updateValueAndValidity({
                  emitEvent: false
                });

            }
          );

        }
      );


    const state =
      history.state;


    if (
      state?.numeroDeic
    ) {

      this.seguimientoForm.patchValue({
        numeroDeic:
          state.numeroDeic
      });

      this.buscarCaso();

    }

  }


  /* =====================================================
     GETTERS
  ===================================================== */

  get esRemitido():
    boolean {

    return (
      this.seguimientoForm
        .get('nuevoEstado')
        ?.value === 'Remitido'
    );

  }


  get nombreDesaparecido():
    string {

    return (
      this.casoEncontrado
        ?.desaparecido
        ?.nombre ||

      this.casoEncontrado
        ?.nombreDesaparecido ||

      'No disponible'
    );

  }


  get seguimientos():
    any[] {

    return (
      this.casoEncontrado
        ?.seguimientos || []
    );

  }


  /* =====================================================
     ARCHIVOS
  ===================================================== */

 onFileChange(event: Event): void {

  const input = event.target as HTMLInputElement;

  const selectedFiles: File[] =
    input.files
      ? Array.from(input.files)
      : [];

  if (!selectedFiles.length) {
    this.files = [];
    this.fileName = null;
    return;
  }

  this.files = selectedFiles;

  this.fileName = selectedFiles
    .map((file: File) => file.name)
    .join(', ');
}


  limpiarArchivos(
    input?: HTMLInputElement
  ): void {

    this.files = [];

    this.fileName = null;


    if (input) {
      input.value = '';
    }

  }


  /* =====================================================
     BUSCAR CASO
  ===================================================== */

  buscarCaso(): void {

    const deic =
      this.seguimientoForm
        .value
        .numeroDeic
        ?.trim();


    if (!deic) {

      this.seguimientoForm
        .get('numeroDeic')
        ?.markAsTouched();

      return;

    }


    this.searching = true;

    this.casoEncontrado = null;


    this.sgicService
      .getCasoPorDeic(
        deic
      )
      .subscribe({

        next: (
          data
        ) => {

          this.casoEncontrado =
            data;


          const estadoActual =
            data
              ?.estadoInvestigacion;


          const estadoExiste =
            this.estados.some(
              estado =>
                estado.value ===
                estadoActual
            );


          this.seguimientoForm
            .patchValue({

              nuevoEstado:
                estadoExiste
                  ? estadoActual
                  : ''

            });


          this.searching =
            false;

        },


        error: (
          error
        ) => {

          this.searching =
            false;


          const backendMessage =
            error
              ?.error
              ?.message;


          const mensaje =
            Array.isArray(
              backendMessage
            )
              ? backendMessage.join(
                  ' '
                )
              : (
                  backendMessage ||
                  'No se encontró el caso con ese número DEIC.'
                );


          this.snackBar.open(
            mensaje,
            'Cerrar',
            {
              duration: 4000,
              panelClass: [
                'snack-error'
              ]
            }
          );

        }

      });

  }


  /* =====================================================
     REGISTRAR SEGUIMIENTO
  ===================================================== */

  enviarSeguimiento():
    void {

    if (
      !this.casoEncontrado
    ) {

      this.snackBar.open(
        'Primero debes buscar un caso válido.',
        'Cerrar',
        {
          duration: 3000,
          panelClass: [
            'snack-warning'
          ]
        }
      );

      return;

    }


    if (
      this.seguimientoForm.invalid
    ) {

      this.seguimientoForm
        .markAllAsTouched();

      this.snackBar.open(
        'Completa los campos obligatorios.',
        'Cerrar',
        {
          duration: 3000,
          panelClass: [
            'snack-warning'
          ]
        }
      );

      return;

    }


    this.submitting =
      true;


    const formData =
      new FormData();


    this.files.forEach(
      file => {

        formData.append(
          'files',
          file
        );

      }
    );


    formData.append(
      'nuevoEstado',
      this.seguimientoForm
        .value
        .nuevoEstado
    );


    if (
      this.esRemitido
    ) {

      formData.append(
        'nombreAcompanante',
        this.seguimientoForm
          .value
          .acompanante || ''
      );


      formData.append(
        'telefono',
        this.seguimientoForm
          .value
          .telefono || ''
      );


      formData.append(
        'direccionLocalizacion',
        this.seguimientoForm
          .value
          .direccion || ''
      );

    }


    const deic =
      this.casoEncontrado
        .numeroDeic;


    this.sgicService
      .enviarSeguimientoAlerta(
        deic,
        formData
      )
      .subscribe({

        next: () => {

          this.snackBar.open(
            'Seguimiento registrado correctamente.',
            'Cerrar',
            {
              duration: 3000,
              panelClass: [
                'snack-success'
              ]
            }
          );


          /*
           * Conservamos el número DEIC
           * y volvemos a consultar el caso.
           *
           * Así el usuario ve inmediatamente
           * el seguimiento agregado.
           */

          this.files = [];

          this.fileName = null;

          this.submitting = false;


          this.buscarCaso();

        },


        error: (
          error
        ) => {

          this.submitting =
            false;


          const backendMessage =
            error
              ?.error
              ?.message;


          const mensaje =
            Array.isArray(
              backendMessage
            )
              ? backendMessage.join(
                  ' '
                )
              : (
                  backendMessage ||
                  'Error al registrar el seguimiento.'
                );


          this.snackBar.open(
            mensaje,
            'Cerrar',
            {
              duration: 4000,
              panelClass: [
                'snack-error'
              ]
            }
          );

        }

      });

  }

}
