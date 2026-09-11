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
  SeguimientoAlertaService
} from '../seguimiento-services/seguimiento-alerta.service';


@Component({
  selector: 'app-seguimiento-alerta',

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
    './seguimiento-alerta.component.html',

  styleUrl:
    './seguimiento-alerta.component.css'
})
export default class SeguimientoAlertaComponent
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
        data: { tipo: 'alerta', numeroDeic: this.numeroNoEncontrado }, width: '1000px', maxWidth: '96vw', maxHeight: '96dvh', autoFocus: 'first-heading',
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
    this.files = [];
    this.fileName = null;
    this.investigadorAsignado.reset('');
    this.investigadorAsignado.setValidators(caso.origenCaso === 'HISTORICO' ? Validators.required : null);
    this.investigadorAsignado.updateValueAndValidity();
    const estado = this.estados.some(e => e.value === caso.estadoInvestigacion) ? caso.estadoInvestigacion : '';
    this.seguimientoForm.patchValue({ numeroDeic: caso.numeroDeic, nuevoEstado: estado });
  }

  bloqueoServidor = false;
  get ultimoSeguimiento(): SeguimientoCaso | undefined { return ultimoSeguimiento(this.seguimientos); }
  get casoCerrado(): boolean { return this.bloqueoServidor || estaCerrado('alerta', this.seguimientos); }

  private manejarConflicto(error: { status?: number }): boolean {
    if (error.status !== 409 || !this.casoEncontrado) return false;
    this.submitting = false;
    this.bloqueoServidor = true;
    const numero = this.casoEncontrado.numeroDeic;
    this.snackBar.open('El expediente fue cerrado o su historial cambió. Se actualizará la información antes de continuar.', 'Cerrar', { duration: 6000 });
    this.sgicService.getCasoPorDeic(numero).subscribe({
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
                estado === 'Remitido' && this.casoEncontrado?.origenCaso !== 'HISTORICO'
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


  get seguimientos(): SeguimientoCaso[] {

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
    if (this.searching || this.submitting || this.abriendoHistorico) return;
    const deic = normalizarNumeroCaso(this.seguimientoForm.value.numeroDeic || '');
    this.seguimientoForm.patchValue({ numeroDeic: deic });
    this.numeroNoEncontrado = ''; this.casoEncontrado = null;
    if (!patronesDeic.alerta.test(deic)) {
      this.snackBar.open('Revise el número DEIC del caso.', 'Cerrar', { duration: 4000, panelClass: ['snack-warning'] });
      return;
    }
    this.searching = true;
    this.sgicService.getCasoPorDeic(deic).subscribe({
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

  enviarSeguimiento():
    void {
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
    if (this.investigadorAsignado.value) formData.append('investigadorAsignado', this.investigadorAsignado.value);


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
