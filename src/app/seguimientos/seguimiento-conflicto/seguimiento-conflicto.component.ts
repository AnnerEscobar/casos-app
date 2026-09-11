import { SeguimientoParticipantesComponent } from '../seguimiento-participantes.component';
import { ultimoSeguimiento, estaCerrado } from '../seguimiento-terminal';
import { inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../auth/auth-service/auth.service';
import { UserRole } from '../../auth/enums/user-role.enum';
import { CasoSeguimiento, PersonaCaso, SeguimientoCaso, RespuestaSeguimiento } from '../../casos/models/caso-historico.model';
import { normalizarNumeroCaso, patronesDeic, mensajeError } from '../../casos/historicos/historico-formulario';
import { HistoricoInfoComponent } from '../../casos/historicos/historico-info.component';
import { ResponsableSeguimientoComponent } from '../../casos/historicos/responsable-seguimiento.component';
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

  imports: [SeguimientoParticipantesComponent, HistoricoInfoComponent, ResponsableSeguimientoComponent,
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
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);
  numeroNoEncontrado = '';
  abriendoHistorico = false;
  readonly investigadorAsignado = new FormControl('');
  get puedeIncorporar(): boolean { return [UserRole.ANALISTA, UserRole.INVESTIGADOR].some(rol => this.auth.hasRole(rol)); }

  async incorporarHistorico(): Promise<void> {
    if (!this.numeroNoEncontrado || !this.puedeIncorporar || this.abriendoHistorico) return;
    this.abriendoHistorico = true;
    try {
      const { IncorporarHistoricoDialogComponent } = await import('../../casos/historicos/incorporar-historico-dialog.component');
      const ref = this.dialog.open(IncorporarHistoricoDialogComponent, {
        data: { tipo: 'conflicto', numeroDeic: this.numeroNoEncontrado }, width: '1000px', maxWidth: '96vw', maxHeight: '96dvh', autoFocus: 'first-heading',
      });
      ref.afterClosed().subscribe((caso: CasoSeguimiento | undefined) => {
        this.abriendoHistorico = false;
        if (caso) {
          this.seleccionarCaso(caso);
          setTimeout(() => {
            const panel = document.getElementById('nuevo-seguimiento-historico');
            panel?.scrollIntoView({ block: 'start', behavior: 'smooth' });
            panel?.focus({ preventScroll: true });
          });
        }
      });
    } catch {
      this.abriendoHistorico = false;
      this.snackBar.open('No se pudo abrir el formulario. Intente nuevamente.', 'Cerrar', { duration: 4000 });
    }
  }

  seleccionarCaso(caso: CasoSeguimiento): void {
    this.bloqueoServidor = false;
    this.casoEncontrado = caso;
    this.numeroNoEncontrado = '';
    this.selectedFile = null;
    this.fileName = null;
    this.investigadorAsignado.reset('');
    this.investigadorAsignado.setValidators(caso.origenCaso === 'HISTORICO' ? Validators.required : null);
    this.investigadorAsignado.updateValueAndValidity();
    const estado = this.estados.some(e => e.value === caso.estadoInvestigacion) ? caso.estadoInvestigacion : '';
    this.seguimientoForm.patchValue({ numeroDeic: caso.numeroDeic, nuevoEstado: estado });
  }

  bloqueoServidor = false;
  get ultimoSeguimiento(): SeguimientoCaso | undefined { return ultimoSeguimiento(this.seguimientos); }
  get casoCerrado(): boolean { return this.bloqueoServidor || estaCerrado('conflicto', this.seguimientos); }

  private manejarConflicto(error: { status?: number }): boolean {
    if (error.status !== 409 || !this.casoEncontrado) return false;
    this.submitting = false;
    this.bloqueoServidor = true;
    const numero = this.casoEncontrado.numeroDeic;
    this.snackBar.open('El expediente fue cerrado o su historial cambió. Se actualizará la información antes de continuar.', 'Cerrar', { duration: 6000 });
    this.seguimientoService.buscarCasoConflictoPorDeic(numero).subscribe({
      next: caso => { if (this.casoEncontrado?.numeroDeic === numero) this.seleccionarCaso(caso); },
      error: () => { this.snackBar.open('No se pudo actualizar el historial. Vuelva a consultar el expediente antes de registrar otro seguimiento.', 'Cerrar', { duration: 6000 }); },
    });
    return true;
  }

  private actualizarHistorial(respuesta: RespuestaSeguimiento): void {
    if (!this.casoEncontrado) return;
    this.casoEncontrado = { ...this.casoEncontrado, estadoInvestigacion: this.seguimientoForm.value.nuevoEstado, seguimientos: [...(this.casoEncontrado.seguimientos || []), respuesta.seguimiento] };
  }


  seguimientoForm!: FormGroup;

  casoEncontrado: CasoSeguimiento | null = null;

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


    this.seguimientoForm.get('numeroDeic')?.valueChanges.subscribe((valor: string) => {
      const numero = normalizarNumeroCaso(valor || '');
      if (this.numeroNoEncontrado && numero !== this.numeroNoEncontrado) this.numeroNoEncontrado = '';
      if (this.casoEncontrado && numero !== this.casoEncontrado.numeroDeic) this.casoEncontrado = null;
    });

    const state = history.state;


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

  get infractores(): PersonaCaso[] {

    return (
      this.casoEncontrado
        ?.infractores || []
    );

  }


  get victimas(): PersonaCaso[] {

    return (
      this.casoEncontrado
        ?.victimas || []
    );

  }


  get seguimientos(): SeguimientoCaso[] {

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
    if (this.searching || this.submitting || this.abriendoHistorico) return;
    const deic = normalizarNumeroCaso(this.seguimientoForm.value.numeroDeic || '');
    this.seguimientoForm.patchValue({ numeroDeic: deic });
    this.numeroNoEncontrado = ''; this.casoEncontrado = null;
    if (!patronesDeic.conflicto.test(deic)) {
      this.snackBar.open('Revise el número DEIC del caso.', 'Cerrar', { duration: 4000, panelClass: ['snack-warning'] });
      return;
    }
    this.searching = true;
    this.seguimientoService.buscarCasoConflictoPorDeic(deic).subscribe({
      next: data => { this.searching = false; this.seleccionarCaso(data); },
      error: error => {
        this.searching = false;
        if (error.status === 404) { this.numeroNoEncontrado = deic; return; }
        this.snackBar.open(mensajeError(error, 'No fue posible consultar el caso. Intente nuevamente.'), 'Cerrar', { duration: 5000, panelClass: ['snack-error'] });
      },
    });
  }


  /* =====================================================
     REGISTRAR SEGUIMIENTO
  ===================================================== */

  enviarSeguimiento(): void {
    if (this.submitting || this.casoCerrado) return;
    if (this.casoEncontrado?.origenCaso === 'HISTORICO' && this.investigadorAsignado.invalid) {
      this.investigadorAsignado.markAsTouched();
      this.snackBar.open('Seleccione al investigador asignado a este seguimiento.', 'Cerrar', { duration: 4000, panelClass: ['snack-warning'] });
      return;
    }


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
    if (this.investigadorAsignado.value) formData.append('investigadorAsignado', this.investigadorAsignado.value);


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

        next: (respuesta) => {

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

          this.actualizarHistorial(respuesta);

        },


        error: (
          error
        ) => {
          if (this.manejarConflicto(error)) return;

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
