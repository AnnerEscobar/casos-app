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
  SeguimientoConflictoService
} from '../seguimiento-services/seguimiento-conflicto.service';


@Component({
  selector: 'app-seguimiento-conflicto',

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
    './seguimiento-conflicto.component.html',

  styleUrl:
    './seguimiento-conflicto.component.css'
})
export default class SeguimientoConflictoComponent
  implements OnInit {

  seguimientoForm!: FormGroup;

  casoEncontrado: any = null;

  selectedFile: File | null = null;

  fileName: string | null = null;

  searching = false;

  submitting = false;


  estados = [
    {
      value: 'Informado',
      label: 'Informado'
    },
    {
      value: 'Desestimado',
      label: 'Desestimado'
    }
  ];


  constructor(
    private fb: FormBuilder,
    private seguimientoService:
      SeguimientoConflictoService,
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

      });


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

  get infractores(): any[] {

    return (
      this.casoEncontrado
        ?.infractores || []
    );

  }


  get victimas(): any[] {

    return (
      this.casoEncontrado
        ?.victimas || []
    );

  }


  get seguimientos(): any[] {

    return (
      this.casoEncontrado
        ?.seguimientos || []
    );

  }


  /* =====================================================
     ARCHIVO
  ===================================================== */

  onFileChange(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    const file: File | null =
      input.files?.[0] || null;


    if (!file) {

      this.selectedFile = null;

      this.fileName = null;

      return;

    }


    const esPdf =
      file.type ===
        'application/pdf' ||
      file.name
        .toLowerCase()
        .endsWith('.pdf');


    if (!esPdf) {

      this.snackBar.open(
        'El documento del seguimiento debe estar en formato PDF.',
        'Cerrar',
        {
          duration: 3000,
          panelClass: [
            'snack-warning'
          ]
        }
      );


      input.value = '';

      this.selectedFile = null;

      this.fileName = null;

      return;

    }


    this.selectedFile =
      file;

    this.fileName =
      file.name;

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


    this.seguimientoService
      .buscarCasoConflictoPorDeic(
        deic
      )
      .subscribe({

        next: (
          data: any
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
              ? backendMessage.join(' ')
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

  enviarSeguimiento(): void {

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
        'Selecciona el estado de la investigación.',
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
      !this.selectedFile
    ) {

      this.snackBar.open(
        'Debes adjuntar un documento PDF que respalde el seguimiento.',
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


    formData.append(
      'estadoInvestigacion',
      this.seguimientoForm
        .value
        .nuevoEstado
    );


    formData.append(
      'file',
      this.selectedFile,
      this.selectedFile.name
    );


    this.seguimientoService
      .enviarSeguimientoConflicto(
        this.casoEncontrado
          .numeroDeic,
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


          this.selectedFile =
            null;

          this.fileName =
            null;

          this.submitting =
            false;


          /*
           * Volvemos a consultar el expediente
           * para mostrar inmediatamente
           * el nuevo seguimiento.
           */

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
              ? backendMessage.join(' ')
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
