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
import { InformeService } from '../../../informes/services/informe.service';


@Component({
  selector: 'app-add-case-conflicto',

  providers: [
    provideNativeDateAdapter()
  ],

  imports: [HistoricoDataComponent,
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

  private informeService =
    inject(InformeService);

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

  informeDeic: string | null =
    null;

  casoYaExiste = false;

  deicDuplicado = '';

  private readonly draftKey =
    'draft:add-case-conflicto';


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


    if (datos?.informe) {

      const inf =
        datos.informe;

      this.informeDeic =
        inf.numeroDeic;


      this.myForm.patchValue({

        numeroDeic:
          inf.numeroDeic,

        numeroMp:
          inf.numeroMp

      });


      const s =
        inf.perfilSecundario || {};


      (this.infractores.at(0) as FormGroup
      ).patchValue({

        nombre:
          s.nombre || '',

        cui:
          s.cui ||
          s.documentoIdentificacion ||
          '',

        fecha_Nac:
          s.fechaNacimiento
            ? new Date(
                s.fechaNacimiento
              )
            : null,

        direccion:
          s.residencia || ''

      });


      const v =
        inf.perfilVictima || {};


      (
        this.victimas.at(0) as FormGroup
      ).patchValue({

        nombre:
          v.nombre || '',

        fecha_Nac:
          v.fechaNacimiento
            ? new Date(
                v.fechaNacimiento
              )
            : null,

        direccion:
          v.residencia || '',

        cui:
          v.cui ||
          v.documentoIdentificacion ||
          ''

      });


    } else if (
      datos?.numeroDeic
    ) {

      this.myForm.patchValue({

        numeroDeic:
          datos.numeroDeic,

        numeroMp:
          datos.numeroMp

      });


    } else {

      this.restaurarBorradorLocal();

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


    this.guardarBorradorLocal();

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

          if (
            this.informeDeic
          ) {

            this.informeService
              .eliminar(
                this.informeDeic
              )
              .subscribe();

          }


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


          sessionStorage.removeItem(
            this.draftKey
          );


          this.selectedFile =
            null;

          this.fileName =
            null;

          this.informeDeic =
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

  resetFormState(
    form: FormGroup
  ): void {

    form.reset();


    Object.keys(
      form.controls
    ).forEach(
      key => {

        const control =
          form.get(key);


        if (
          control instanceof
          FormGroup
        ) {

          this.resetFormState(
            control
          );

        } else {

          control
            ?.markAsPristine();

          control
            ?.markAsUntouched();

          control
            ?.setErrors(null);

        }

      }
    );

  }


  /* =====================================================
     BORRADOR
  ===================================================== */

  private guardarBorradorLocal():
    void {

    sessionStorage.setItem(
      this.draftKey,

      JSON.stringify({

        value:
          this.myForm
            .getRawValue(),

        fileName:
          this.fileName

      })
    );

  }


  private restaurarBorradorLocal():
    void {

    const raw =
      sessionStorage.getItem(
        this.draftKey
      );


    if (!raw) {
      return;
    }


    try {

      const draft =
        JSON.parse(raw);

      const value =
        draft.value || {};


      value.infractores =
        (
          value.infractores ||
          []
        ).map(
          (item: any) => ({

            ...item,

            fecha_Nac:
              item.fecha_Nac
                ? new Date(
                    item.fecha_Nac
                  )
                : null

          })
        );


      value.victimas =
        (
          value.victimas ||
          []
        ).map(
          (item: any) => ({

            ...item,

            fecha_Nac:
              item.fecha_Nac
                ? new Date(
                    item.fecha_Nac
                  )
                : null

          })
        );


      this.infractores.clear();

      this.victimas.clear();


      (
        value.infractores?.length
          ? value.infractores
          : [{}]
      ).forEach(
        () =>
          this.agregarInfractor()
      );


      (
        value.victimas?.length
          ? value.victimas
          : [{}]
      ).forEach(
        () =>
          this.agregarVictima()
      );


      this.myForm.patchValue(
        value
      );


      this.fileName =
        draft.fileName
          ? `${draft.fileName} (selecciona el archivo nuevamente)`
          : null;


      this._snackBar.open(
        'Recuperé un borrador local. Revisa los datos y selecciona el archivo nuevamente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: [
            'snack-warning'
          ]
        }
      );


    } catch {

      sessionStorage.removeItem(
        this.draftKey
      );

    }

  }

}
