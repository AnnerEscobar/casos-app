import {
  Component,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  MatStepper,
  MatStepperModule,
} from '@angular/material/stepper';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';

import { finalize } from 'rxjs';

import { DocumentacionInicialService } from '../../services/documentacion-inicial.service';

import {
  CrearDocumentacionInicial,
  ElementoPlan,
  GuardarPlan,
  GuardarRubrica,
  ItemRubrica,
  ModalidadMaltrato,
  TipoCaso,
} from '../../models/documentacion-inicial.model';


@Component({
  selector: 'app-nueva-documentacion',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule,
  ],

  templateUrl: './nueva-documentacion.component.html',
  styleUrl: './nueva-documentacion.component.css',
})
export class NuevaDocumentacionComponent implements OnInit {

  @ViewChild('stepper')
  stepper?: MatStepper;


  private readonly fb = inject(FormBuilder);

  private readonly documentacionService =
    inject(DocumentacionInicialService);

  private readonly snackBar =
    inject(MatSnackBar);


  /* ======================================================
     ESTADO GENERAL
  ====================================================== */

  documentacionId: string | null = null;

  guardando = false;
  cargandoPlan = false;
  cargandoRubrica = false;

  caratulaGuardada = false;
  planGuardado = false;
  rubricaGuardada = false;


  /* ======================================================
     PASO 1 - CARÁTULA
  ====================================================== */

  caratulaForm: FormGroup = this.fb.group({

    tipoCaso: [
      '',
      Validators.required,
    ],

    numeroDeic: [
      '',
      Validators.required,
    ],

    numeroMp: [''],

    numeroAlerta: [''],

    modalidadMaltrato: [''],

    nombre: [
      '',
      Validators.required,
    ],

    edad: [
      '',
      Validators.required,
    ],

    lugar: [
      '',
      Validators.required,
    ],

    departamento: [''],

    municipio: [''],

    observaciones: [''],

  });


  /* ======================================================
     PASO 2 - PLAN
  ====================================================== */

  tituloPlan = '';

  elementosPlan: ElementoPlan[] = [];

  observacionesPlan = '';


  /* ======================================================
     PASO 3 - RÚBRICA
  ====================================================== */

  tituloRubrica = '';

  preguntaProtocolo = '';

  conoceProtocolo: 'SI' | 'NO' | null = null;

  itemsRubrica: ItemRubrica[] = [];


  /* ======================================================
     INICIALIZACIÓN
  ====================================================== */

  ngOnInit(): void {

    this.escucharTipoCaso();

  }


  /* ======================================================
     GETTERS
  ====================================================== */

  get tipoCaso(): TipoCaso | null {

    const value =
      this.caratulaForm
        .get('tipoCaso')
        ?.value;

    return value
      ? value as TipoCaso
      : null;
  }


  get esAlerta(): boolean {

    return this.tipoCaso === 'Alerta';

  }


  get esMaltrato(): boolean {

    return this.tipoCaso === 'Maltrato';

  }


  get esConflicto(): boolean {

    return this.tipoCaso === 'Conflicto';

  }


  /* ======================================================
     CAMBIO DE TIPO DE CASO
  ====================================================== */

  private escucharTipoCaso(): void {

    const tipoControl =
      this.caratulaForm.get('tipoCaso');

    const alertaControl =
      this.caratulaForm.get('numeroAlerta');

    const modalidadControl =
      this.caratulaForm.get('modalidadMaltrato');


    tipoControl?.valueChanges.subscribe(
      (tipo: TipoCaso | null) => {

        /* -----------------------------
           ALERTA
        ----------------------------- */

        if (tipo === 'Alerta') {

          alertaControl?.setValidators([
            Validators.required,
          ]);

        } else {

          alertaControl?.clearValidators();

          alertaControl?.setValue(
            '',
            {
              emitEvent: false,
            },
          );
        }


        alertaControl?.updateValueAndValidity({
          emitEvent: false,
        });


        /* -----------------------------
           MALTRATO
        ----------------------------- */

        if (tipo === 'Maltrato') {

          modalidadControl?.setValidators([
            Validators.required,
          ]);

        } else {

          modalidadControl?.clearValidators();

          modalidadControl?.setValue(
            '',
            {
              emitEvent: false,
            },
          );
        }


        modalidadControl?.updateValueAndValidity({
          emitEvent: false,
        });

      },
    );
  }


  /* ======================================================
     PASO 1 - GUARDAR CARÁTULA
  ====================================================== */

  guardarCaratula(): void {

    if (this.caratulaForm.invalid) {

      this.caratulaForm.markAllAsTouched();

      this.mostrarMensaje(
        'Complete los campos obligatorios de la carátula.',
      );

      return;
    }


    const value =
      this.caratulaForm.getRawValue();


    const caratula = {

      numeroMp:
        this.normalizarTexto(
          value.numeroMp,
        ),

      nombre:
        this.normalizarTexto(
          value.nombre,
        ),

      edad:
        this.normalizarTexto(
          value.edad,
        ),

      lugar:
        this.normalizarTexto(
          value.lugar,
        ),

      departamento:
        this.normalizarTexto(
          value.departamento,
        ),

      municipio:
        this.normalizarTexto(
          value.municipio,
        ),

      observaciones:
        this.normalizarTexto(
          value.observaciones,
        ),

      ...(this.esAlerta
        ? {
            numeroAlerta:
              this.normalizarTexto(
                value.numeroAlerta,
              ),
          }
        : {}),

    };


    /* ====================================================
       ACTUALIZAR BORRADOR EXISTENTE
    ==================================================== */

    const idActual =
      this.documentacionId;


    if (idActual) {

      const payload = {

        numeroDeic:
          this.normalizarTexto(
            value.numeroDeic,
          ),

        ...(this.esMaltrato
          ? {
              modalidadMaltrato:
                value.modalidadMaltrato as ModalidadMaltrato,
            }
          : {}),

        caratula,

      };


      this.guardando = true;


      this.documentacionService
        .actualizarCaratula(
          idActual,
          payload,
        )
        .pipe(
          finalize(() => {

            this.guardando = false;

          }),
        )
        .subscribe({

          next: () => {

            this.caratulaGuardada = true;

            this.mostrarMensaje(
              'Carátula actualizada correctamente.',
            );

            this.cargarPlan(true);

          },

          error: (error) => {

            this.mostrarError(
              error,
              'No se pudo actualizar la carátula.',
            );

          },

        });


      return;
    }


    /* ====================================================
       CREAR NUEVO BORRADOR
    ==================================================== */

    const payload:
      CrearDocumentacionInicial = {

      tipoCaso:
        value.tipoCaso as TipoCaso,

      numeroDeic:
        this.normalizarTexto(
          value.numeroDeic,
        ),

      caratula: {

        numeroMp:
          caratula.numeroMp,

        nombre:
          caratula.nombre,

        edad:
          caratula.edad,

        lugar:
          caratula.lugar,

        departamento:
          caratula.departamento,

        municipio:
          caratula.municipio,

        observaciones:
          caratula.observaciones,

        ...(this.esAlerta
          ? {
              numeroAlerta:
                this.normalizarTexto(
                  value.numeroAlerta,
                ),
            }
          : {}),

      },

      ...(this.esMaltrato
        ? {
            modalidadMaltrato:
              value.modalidadMaltrato as ModalidadMaltrato,
          }
        : {}),

    };


    this.guardando = true;


    this.documentacionService
      .crear(payload)
      .pipe(
        finalize(() => {

          this.guardando = false;

        }),
      )
      .subscribe({

        next: (documentacion) => {

          this.documentacionId =
            documentacion._id;

          this.caratulaGuardada =
            true;


          /*
           * Después de crear el borrador
           * no permitimos cambiar el tipo.
           */
          this.caratulaForm
            .get('tipoCaso')
            ?.disable({
              emitEvent: false,
            });


          this.mostrarMensaje(
            'Carátula guardada. Se creó el borrador de documentación inicial.',
          );


          this.cargarPlan(true);

        },

        error: (error) => {

          this.mostrarError(
            error,
            'No se pudo crear la documentación inicial.',
          );

        },

      });
  }


  /* ======================================================
     PASO 2 - CARGAR PLAN
  ====================================================== */

  cargarPlan(
    avanzar = false,
  ): void {

    const id =
      this.documentacionId;


    if (!id) {

      this.mostrarMensaje(
        'Primero debe guardar la carátula.',
      );

      return;
    }


    this.cargandoPlan = true;


    this.documentacionService
      .obtenerPlan(id)
      .pipe(
        finalize(() => {

          this.cargandoPlan = false;

        }),
      )
      .subscribe({

        next: (plan) => {

          this.tituloPlan =
            plan.titulo;


          this.elementosPlan =
            plan.elementos.map(
              (elemento) => ({

                ...elemento,

                informacionObtenida:
                  elemento.informacionObtenida
                  ?? '',

                informacionNecesitaObtener:
                  elemento.informacionNecesitaObtener
                  ?? '',

                diligenciasRealizar:
                  elemento.diligenciasRealizar
                  ?? '',

              }),
            );


          this.observacionesPlan =
            plan.observaciones
            ?? '';


          if (avanzar) {

            setTimeout(() => {

              this.stepper?.next();

            });
          }

        },

        error: (error) => {

          this.mostrarError(
            error,
            'No se pudo cargar el plan de investigación.',
          );

        },

      });
  }


  /* ======================================================
     PASO 2 - GUARDAR PLAN
  ====================================================== */

  guardarPlan(): void {

    const id =
      this.documentacionId;


    if (!id) {

      this.mostrarMensaje(
        'Primero debe guardar la carátula.',
      );

      return;
    }


    if (
      this.elementosPlan.length === 0
    ) {

      this.mostrarMensaje(
        'No se encontró la plantilla del plan de investigación.',
      );

      return;
    }


    const payload:
      GuardarPlan = {

      elementos:
        this.elementosPlan.map(
          (elemento) => ({

            codigo:
              elemento.codigo,

            informacionObtenida:
              this.normalizarTexto(
                elemento.informacionObtenida,
              ),

            informacionNecesitaObtener:
              this.normalizarTexto(
                elemento.informacionNecesitaObtener,
              ),

            diligenciasRealizar:
              this.normalizarTexto(
                elemento.diligenciasRealizar,
              ),

          }),
        ),

      observaciones:
        this.normalizarTexto(
          this.observacionesPlan,
        ),

    };


    this.guardando = true;


    this.documentacionService
      .guardarPlan(
        id,
        payload,
      )
      .pipe(
        finalize(() => {

          this.guardando = false;

        }),
      )
      .subscribe({

        next: () => {

          this.planGuardado = true;


          this.mostrarMensaje(
            'Plan de investigación guardado correctamente.',
          );


          this.cargarRubrica(true);

        },

        error: (error) => {

          this.mostrarError(
            error,
            'No se pudo guardar el plan de investigación.',
          );

        },

      });
  }


  /* ======================================================
     PASO 3 - CARGAR RÚBRICA
  ====================================================== */

  cargarRubrica(
    avanzar = false,
  ): void {

    const id =
      this.documentacionId;


    if (!id) {

      this.mostrarMensaje(
        'Primero debe completar los pasos anteriores.',
      );

      return;
    }


    this.cargandoRubrica = true;


    this.documentacionService
      .obtenerRubrica(id)
      .pipe(
        finalize(() => {

          this.cargandoRubrica = false;

        }),
      )
      .subscribe({

        next: (rubrica) => {

          this.tituloRubrica =
            rubrica.titulo;


          this.preguntaProtocolo =
            rubrica.preguntaProtocolo;


          this.conoceProtocolo =
            rubrica.conoceProtocolo;


          this.itemsRubrica =
            rubrica.items.map(
              (item) => ({

                ...item,

                respuesta:
                  item.respuesta
                  ?? null,

                observaciones:
                  item.observaciones
                  ?? '',

              }),
            );


          if (avanzar) {

            setTimeout(() => {

              this.stepper?.next();

            });
          }

        },

        error: (error) => {

          this.mostrarError(
            error,
            'No se pudo cargar la rúbrica correspondiente.',
          );

        },

      });
  }


  /* ======================================================
     PASO 3 - GUARDAR RÚBRICA
  ====================================================== */

  guardarRubrica(): void {

    const id =
      this.documentacionId;


    if (!id) {

      this.mostrarMensaje(
        'Primero debe completar los pasos anteriores.',
      );

      return;
    }


    const conoceProtocolo =
      this.conoceProtocolo;


    if (!conoceProtocolo) {

      this.mostrarMensaje(
        'Debe responder la pregunta sobre el conocimiento del protocolo.',
      );

      return;
    }


    const itemsRespondibles =
      this.itemsRubrica.filter(
        (item) =>
          item.tipo === 'ITEM',
      );


    const incompletos =
      itemsRespondibles.filter(
        (item) =>
          item.respuesta !== 'SI' &&
          item.respuesta !== 'NO',
      );


    if (
      incompletos.length > 0
    ) {

      this.mostrarMensaje(
        `Debe responder Sí o No en todos los elementos de la rúbrica. Faltan ${incompletos.length}.`,
      );

      return;
    }


    const payload:
      GuardarRubrica = {

      conoceProtocolo,

      respuestas:
        itemsRespondibles.map(
          (item) => ({

            codigo:
              item.codigo,

            respuesta:
              item.respuesta as
                | 'SI'
                | 'NO',

            observaciones:
              this.normalizarTexto(
                item.observaciones,
              ),

          }),
        ),

    };


    this.guardando = true;


    this.documentacionService
      .guardarRubrica(
        id,
        payload,
      )
      .pipe(
        finalize(() => {

          this.guardando = false;

        }),
      )
      .subscribe({

        next: () => {

          this.rubricaGuardada =
            true;


          this.mostrarMensaje(
            'Rúbrica guardada correctamente.',
          );

        },

        error: (error) => {

          this.mostrarError(
            error,
            'No se pudo guardar la rúbrica.',
          );

        },

      });
  }


  /* ======================================================
     TRACK BY - PLAN
  ====================================================== */

  identificarElementoPlan(
    index: number,
    item: ElementoPlan,
  ): string {

    return item.codigo;
  }


  /* ======================================================
     TRACK BY - RÚBRICA
  ====================================================== */

  identificarItemRubrica(
    index: number,
    item: ItemRubrica,
  ): string {

    return item.codigo;
  }


  /* ======================================================
     NORMALIZACIÓN
  ====================================================== */

  private normalizarTexto(
    value:
      | string
      | null
      | undefined,
  ): string {

    if (!value) {
      return '';
    }


    return value
      .trim()
      .replace(
        /\s+/g,
        ' ',
      );
  }


  /* ======================================================
     MENSAJES
  ====================================================== */

  private mostrarMensaje(
    mensaje: string,
  ): void {

    this.snackBar.open(
      mensaje,
      'Cerrar',
      {
        duration: 3500,
      },
    );
  }


  /* ======================================================
     ERRORES
  ====================================================== */

  private mostrarError(
    error: any,
    fallback: string,
  ): void {

    console.error(
      'Documentación inicial:',
      error,
    );


    let mensaje =
      fallback;


    if (
      Array.isArray(
        error?.error?.message,
      )
    ) {

      mensaje =
        error.error.message.join(' ');

    } else if (
      typeof error?.error?.message ===
      'string'
    ) {

      mensaje =
        error.error.message;

    } else if (
      typeof error?.message ===
      'string'
    ) {

      mensaje =
        error.message;
    }


    this.snackBar.open(
      mensaje,
      'Cerrar',
      {
        duration: 5500,
      },
    );
  }

}
