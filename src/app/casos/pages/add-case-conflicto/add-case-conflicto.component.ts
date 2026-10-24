import { BorradorFormularioDirective } from '../../../shared/borradores/borrador-formulario.directive';
import { CargaArchivoComponent } from '../../../shared/components/carga-archivo/carga-archivo.component';
import { Input, Output, EventEmitter, DestroyRef } from '@angular/core';
import { HistoricoDataComponent } from '../../historicos/historico-data.component';
import { HistoricoFormulario, quitarRequeridos, mensajeError, normalizarNumeroCaso } from '../../historicos/historico-formulario';
import { CasoSeguimiento } from '../../models/caso-historico.model';
import { CommonModule } from '@angular/common';

import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Router } from '@angular/router';

import { ConflictoService } from '../../services/conflicto.service';



@Component({
  selector: 'app-add-case-conflicto',

  providers: [
    provideNativeDateAdapter()
  ],

  imports: [BorradorFormularioDirective,CargaArchivoComponent,HistoricoDataComponent,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule
  ],

  templateUrl:
    './add-case-conflicto.component.html',

  styleUrl:
    './add-case-conflicto.component.css'
})
export default class AddCaseConflictoComponent
  implements OnInit {
  @Input() modoHistorico = false;
  @Input() numeroDeicInicial = '';
  @Output() historicoCreado = new EventEmitter<CasoSeguimiento>();
  @Output() ocupacionCambio = new EventEmitter<boolean>();
  readonly historico = new HistoricoFormulario();
  private destroyRef = inject(DestroyRef);

  private iniciarHistorico(): void {
    this.historico.preparar(this.myForm, 'conflicto', this.numeroDeicInicial);
    const sub = this.historico.datos.controls.estadoExpedienteHistorico.valueChanges.subscribe(() => {
      this.historico.cambiarEstado(this.myForm);
      if (this.historico.minimo) { this.selectedFile = null; this.fileName = null; }
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  private guardarHistorico(): void {
    if (this.isLoading) return;
    for (const campo of ['numeroDeic', 'numeroMp', 'numeroAlerta']) {
      const control = this.myForm.get(campo);
      if (typeof control?.value === 'string') control.setValue(normalizarNumeroCaso(control.value));
    }
    if (this.myForm.invalid || this.historico.datos.invalid) {
      this.myForm.markAllAsTouched(); this.historico.datos.markAllAsTouched();
      this._snackBar.open('Seleccione el estado del expediente y revise los datos ingresados.', 'Cerrar', { duration: 4000, panelClass: ['snack-warning'] });
      return;
    }
    this.isLoading = true; this.ocupacionCambio.emit(true);
    this.conflictoService.crearHistorico(this.historico.payload(this.myForm, 'conflicto'), this.historico.minimo ? null : this.selectedFile).subscribe({
      next: caso => {
        this.isLoading = false; this.ocupacionCambio.emit(false);
        this._snackBar.open('El caso histórico fue incorporado correctamente.', 'Cerrar', { duration: 4000, panelClass: ['snack-success'] });
        this.historicoCreado.emit(caso);
      },
      error: error => {
        this.isLoading = false; this.ocupacionCambio.emit(false);
        this._snackBar.open(mensajeError(error, 'No fue posible incorporar el caso histórico.'), 'Cerrar', { duration: 6000, panelClass: ['snack-error'] });
      },
    });
  }


  private formBuilder =
    inject(FormBuilder);

  private conflictoService =
    inject(ConflictoService);



  private _snackBar =
    inject(MatSnackBar);

  private router =
    inject(Router);


  estados = [
    {
      value: 'Informado',
      viewValue: 'Informado'
    },
    {
      value: 'Concluido',
      viewValue: 'Concluido'
    }
  ];


  isLoading = false;

  fileName: string | null =
    null;

  selectedFile: File | null =
    null;



  casoYaExiste = false;

  deicDuplicado = '';


  /* =====================================================
     FORMULARIO
  ===================================================== */

  myForm = this.formBuilder.group({

    numeroDeic: [
      '',
      [
        Validators.required,
        Validators.pattern(
          /^DEIC53-\d{4}-\d{2}-\d{2}-\d+$/
        )
      ]
    ],

    numeroMp: [
      '',
      Validators.required
    ],

    estadoInvestigacion: [
      '',
      Validators.required
    ],

    infractores:
      this.formBuilder.array([]),

    victimas:
      this.formBuilder.array([]),

    lugarHechos:
      this.formBuilder.group({

        departamento: [
          '',
          Validators.required
        ],

        municipio: [
          '',
          Validators.required
        ],

        direccionDetallada: [
          '',
          Validators.required
        ]

      })

  });


  /* =====================================================
     GETTERS
  ===================================================== */

  get infractores():
    FormArray<FormGroup> {

    return this.myForm.get(
      'infractores'
    ) as FormArray<FormGroup>;

  }


  get victimas():
    FormArray<FormGroup> {

    return this.myForm.get(
      'victimas'
    ) as FormArray<FormGroup>;

  }


  /* =====================================================
     INIT
  ===================================================== */

  ngOnInit(): void {
    if (this.modoHistorico) { this.iniciarHistorico(); return; }

    this.agregarInfractor();

    this.agregarVictima();


    const datos =
      history.state;


    if (
      datos?.numeroDeic
    ) {

      this.myForm.patchValue({

        numeroDeic:
          datos.numeroDeic,

        numeroMp:
          datos.numeroMp

      });


    }

  }


  /* =====================================================
     ARCHIVO PDF
  ===================================================== */

  onFileSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];


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

      this._snackBar.open(
        'Solo se permiten archivos PDF',
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
     INFRACTORES
  ===================================================== */

  agregarInfractor(): void {

    this.infractores.push(

      this.formBuilder.group({

        nombre: [
          '',
          Validators.required
        ],

        cui: [
          '',
          Validators.required
        ],

        fecha_Nac: [
          null,
          Validators.required
        ],

        direccion: [
          '',
          Validators.required
        ]

      })

    );


  if (this.modoHistorico) { quitarRequeridos(this.infractores); quitarRequeridos(this.victimas); this.historico.cambiarEstado(this.myForm); }
}


  eliminarInfractor(
    index: number
  ): void {

    if (
      this.infractores.length > (this.modoHistorico ? 0 : 1)
    ) {

      this.infractores.removeAt(
        index
      );

    }

  }


  /* =====================================================
     VÍCTIMAS
  ===================================================== */

  agregarVictima(): void {

    this.victimas.push(

      this.formBuilder.group({

        nombre: [
          '',
          Validators.required
        ],

        cui: [
          '',
          Validators.required
        ],

        fecha_Nac: [
          null,
          Validators.required
        ],

        direccion: [
          '',
          Validators.required
        ]

      })

    );


  if (this.modoHistorico) { quitarRequeridos(this.infractores); quitarRequeridos(this.victimas); this.historico.cambiarEstado(this.myForm); }
}


  eliminarVictima(
    index: number
  ): void {

    if (
      this.victimas.length > (this.modoHistorico ? 0 : 1)
    ) {

      this.victimas.removeAt(
        index
      );

    }

  }


  /* =====================================================
     REGISTRAR CASO
  ===================================================== */

  registrarCaso(): void {
  if (this.modoHistorico) { this.guardarHistorico(); return; }

    if (
      this.myForm.invalid
    ) {

      this.myForm.markAllAsTouched();


      this._snackBar.open(
        'Debes completar todos los campos obligatorios',
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

      this._snackBar.open(
        'Debes seleccionar el PDF del expediente',
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


    const esPdf =
      this.selectedFile.type ===
        'application/pdf' ||
      this.selectedFile.name
        .toLowerCase()
        .endsWith('.pdf');


    if (!esPdf) {

      this._snackBar.open(
        'El archivo debe estar en formato PDF',
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

    this.isLoading = true;


    const value =
      this.myForm.getRawValue();

    const formData =
      new FormData();


    /* ===============================
       DATOS GENERALES
    =============================== */

    formData.append(
      'numeroDeic',
      value.numeroDeic
        ?.trim() || ''
    );


    formData.append(
      'numeroMp',
      value.numeroMp
        ?.trim() || ''
    );


    formData.append(
      'estadoInvestigacion',
      value.estadoInvestigacion ||
        ''
    );


    /* ===============================
       INFRACTORES
    =============================== */

    const infractores =
      (value.infractores || [])
        .map(
          (persona: any) => ({

            nombre:
              persona.nombre || '',

            cui:
              persona.cui || '',

            fecha_Nac:
              persona.fecha_Nac
                ? new Date(
                    persona.fecha_Nac
                  ).toISOString()
                : null,

            direccion:
              persona.direccion || ''

          })
        );


    formData.append(
      'infractores',
      JSON.stringify(
        infractores
      )
    );


    /* ===============================
       VÍCTIMAS
    =============================== */

    const victimas =
      (value.victimas || [])
        .map(
          (persona: any) => ({

            nombre:
              persona.nombre || '',

            cui:
              persona.cui || '',

            fecha_Nac:
              persona.fecha_Nac
                ? new Date(
                    persona.fecha_Nac
                  ).toISOString()
                : null,

            direccion:
              persona.direccion || ''

          })
        );


    formData.append(
      'victimas',
      JSON.stringify(
        victimas
      )
    );


    /* ===============================
       LUGAR DE LOS HECHOS
    =============================== */

    formData.append(
      'lugarHechos',
      JSON.stringify({

        departamento:
          value.lugarHechos
            ?.departamento || '',

        municipio:
          value.lugarHechos
            ?.municipio || '',

        direccionDetallada:
          value.lugarHechos
            ?.direccionDetallada || ''

      })
    );


    /* ===============================
       PDF
    =============================== */

    formData.append(
      'file',
      this.selectedFile,
      this.selectedFile.name
    );


    /* ===============================
       REQUEST
    =============================== */

    this.conflictoService
      .registrarConflicto(
        formData
      )
      .subscribe({

        next: () => {




          this._snackBar.open(
            'Caso registrado con éxito',
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



          this.isLoading =
            false;


          this.infractores.clear();

          this.victimas.clear();

          this.myForm.reset();

          this.agregarInfractor();

          this.agregarVictima();

        },


        error: (
          error
        ) => {

          this.isLoading =
            false;


          console.error(
            'Error al registrar conflicto:',
            error
          );


          const backendMessage =
            error?.error?.message;


          const msg =
            Array.isArray(
              backendMessage
            )
              ? backendMessage.join(
                  ' '
                )
              : (
                  backendMessage ||
                  'Error al registrar el caso'
                );


          if (
            msg
              .toLowerCase()
              .includes('exist')
          ) {

            this.deicDuplicado =
              value.numeroDeic ||
              '';

            this.casoYaExiste =
              true;

            return;

          }


          this._snackBar.open(
            msg,
            'Cerrar',
            {
              duration: 5000,
              panelClass: [
                'snack-error'
              ]
            }
          );

        }

      });

  }


  /* =====================================================
     SEGUIMIENTO
  ===================================================== */

  irASeguimiento(): void {

    this.router.navigate(
      [
        '/casos/seguimiento-conflicto'
      ],
      {
        state: {
          numeroDeic:
            this.deicDuplicado
        }
      }
    );

  }


  /* =====================================================
     RESET
  ===================================================== */

  resetFormState(form: FormGroup): void {
    form.reset();
    form.markAsPristine();
    form.markAsUntouched();
  }
  prepararBorrador = (datos: any) => {
    for (const tipo of ['infractores', 'victimas'] as const) {
      const cantidad = Array.isArray(datos[tipo]) ? datos[tipo].length : 0;
      while (this[tipo].length < cantidad) { if (tipo === 'infractores') this.agregarInfractor(); else this.agregarVictima(); }
      while (this[tipo].length > cantidad) this[tipo].removeAt(this[tipo].length - 1);
    }
  };


}
