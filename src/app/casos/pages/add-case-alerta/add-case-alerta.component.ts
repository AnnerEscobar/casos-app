import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertaService } from '../../services/alerta.service';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { InformeService } from '../../../informes/services/informe.service';

@Component({
  selector: 'app-add-case-alerta',
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule, MatButtonModule, MatDatepickerModule,
    MatFormFieldModule, MatIconModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, ReactiveFormsModule,
    MatProgressSpinnerModule, MatCardModule
  ],
  templateUrl: './add-case-alerta.component.html',
  styleUrl: './add-case-alerta.component.css'
})
export default class AddCaseAlertaComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);
  private alertaService = inject(AlertaService);
  private informeService = inject(InformeService);
  private router = inject(Router);

  isLoading = false;
  fileName: string | null = null;
  selectedFile: File | null = null;
  informeDeic: string | null = null;
  casoYaExiste = false;
  deicDuplicado = '';
  private readonly draftKey = 'draft:add-case-alerta';

  estados = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Concluido', viewValue: 'Concluido' },
    { value: 'Remitido', viewValue: 'Remitido' },
  ];

  origenesAlerta = [
    { value: 'Casa hogar', viewValue: 'Casa hogar' },
    { value: 'Constatacion PGN', viewValue: 'Constatacion PGN' },
    { value: 'Desaparicion del hogar', viewValue: 'Desaparicion del hogar' },
    { value: 'Otro', viewValue: 'Otro' },
  ];

  casasHogar = [
    'Diamante I',
    'Diamante II',
    'Diamante III',
    'Diamante IV',
    'Diamante V',
    'Zafiro I',
    'Zafiro II',
    'Zafiro III',
    'Zafiro IV',
    'Zafiro V',
  ];

  myForm = this.formBuilder.group({

    numeroDeic: [
      '',
      [
        Validators.required,
        Validators.pattern(/^DEIC52-\d{4}-\d{2}-\d{2}-\d+$/)
      ]
    ],

    numeroMp: [
      '',
      [
        Validators.required,
        Validators.pattern(/^M0030-\d{4}-\d+$/)
      ]
    ],

    numeroAlerta: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d+-\d{4}$/)
      ]
    ],

    nombreDesaparecido: [
      '',
      Validators.required
    ],

    fecha_Nac: [
      null,
      Validators.required
    ],

    estadoInvestigacion: [
      '',
      Validators.required
    ],

    origenAlerta: [''],

    casaHogar: [''],

    ubicacionGps: [''],


    // V3
    denunciante: this.formBuilder.group({

      nombre: [
        '',
        Validators.required
      ],

      cui: [''],

      telefono: ['']

    }),


    // V3
    lugarDesaparicion: this.formBuilder.group({

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

    }),


    // V3
    datosLocalizacion: this.formBuilder.group({

      direccionLocalizacion: [''],

      nombrePersonaConQuienEstaba: [''],

      telefono: [''],

      horaLocalizacion: [''],

      fechaLocalizacion: [null]

    })

  });

  ngOnInit() {
    this.myForm.get('estadoInvestigacion')?.valueChanges.subscribe((estado) => {
      const mostrar = estado === 'Remitido';
      const campos = ['direccionLocalizacion', 'nombreAcompanante', 'telefono', 'horaLocalizacion', 'fechaLocalizacion'];
      campos.forEach(campo => {
        const control = this.myForm.get(campo);
        if (mostrar) {
          control?.setValidators(Validators.required);
          control?.updateValueAndValidity();
        } else {
          control?.clearValidators();
          control?.setValue('');
          control?.updateValueAndValidity();
        }
      });
    });

    this.myForm
      .get('estadoInvestigacion')
      ?.valueChanges
      .subscribe((estado) => {

        const mostrar =
          estado === 'Remitido';

        const datosLocalizacion =
          this.myForm.get(
            'datosLocalizacion'
          ) as FormGroup;

        const campos = [
          'direccionLocalizacion',
          'nombrePersonaConQuienEstaba',
          'telefono',
          'horaLocalizacion',
          'fechaLocalizacion'
        ];

        campos.forEach(campo => {

          const control =
            datosLocalizacion.get(campo);

          if (mostrar) {

            control?.setValidators(
              Validators.required
            );

          } else {

            control?.clearValidators();

          }

          control?.updateValueAndValidity({
            emitEvent: false
          });

        });


        if (!mostrar) {

          datosLocalizacion.reset({

            direccionLocalizacion: '',

            nombrePersonaConQuienEstaba: '',

            telefono: '',

            horaLocalizacion: '',

            fechaLocalizacion: null

          }, {
            emitEvent: false
          });

        }

      });

    const datos = history.state;

    if (datos?.informe) {
      const inf = datos.informe;
      this.informeDeic = inf.numeroDeic;
      const v = inf.perfilVictima || {};
      const dg = inf.datosGenerales || {};

      this.myForm.patchValue({
        numeroDeic: inf.numeroDeic,
        numeroMp: inf.numeroMp,
        numeroAlerta: dg.numeroAlerta || '',
        nombreDesaparecido: v.nombre || '',
        fecha_Nac: v.fechaNacimiento ? new Date(v.fechaNacimiento) as any : null,
      });

    } else if (datos?.numeroDeic) {
      this.myForm.patchValue({
        numeroDeic: datos.numeroDeic,
        numeroMp: datos.numeroMp,
        numeroAlerta: datos.numeroAlerta,
        nombreDesaparecido: datos.nombre,
        fecha_Nac: datos.fecha_Nac,
        lugarDesaparicion: {

          departamento:
            datos.departamento || '',

          municipio:
            datos.municipio || '',

          direccionDetallada:
            datos.lugar || ''

        }
      });
    } else {
      this.restaurarBorradorLocal();
    }
  }

onFileSelected(event: Event): void {

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
    file.type === 'application/pdf' ||
    file.name
      .toLowerCase()
      .endsWith('.pdf');


  if (!esPdf) {

    this._snackBar.open(
      'Solo se permiten archivos PDF',
      'Cerrar',
      {
        duration: 3000,
        panelClass: ['snack-warning']
      }
    );

    input.value = '';

    this.selectedFile = null;
    this.fileName = null;

    return;
  }


  this.selectedFile = file;

  this.fileName =
    file.name;

}

  registrarCaso(): void {

  if (this.myForm.invalid) {

    this.myForm.markAllAsTouched();

    this._snackBar.open(
      'Debes completar todos los campos obligatorios',
      'Cerrar',
      {
        duration: 3000,
        panelClass: ['snack-warning']
      }
    );

    return;
  }


  if (!this.selectedFile) {

    this._snackBar.open(
      'Debes seleccionar el PDF del expediente',
      'Cerrar',
      {
        duration: 3000,
        panelClass: ['snack-warning']
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
        panelClass: ['snack-warning']
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


  // DATOS DEL CASO

  formData.append(
    'numeroDeic',
    value.numeroDeic || ''
  );

  formData.append(
    'numeroMp',
    value.numeroMp || ''
  );

  formData.append(
    'numeroAlerta',
    value.numeroAlerta || ''
  );

  formData.append(
    'nombreDesaparecido',
    value.nombreDesaparecido || ''
  );


  if (value.fecha_Nac) {

    formData.append(
      'fecha_Nac',
      new Date(
        value.fecha_Nac
      ).toISOString()
    );

  }


  formData.append(
    'estadoInvestigacion',
    value.estadoInvestigacion || ''
  );


  if (value.origenAlerta) {

    formData.append(
      'origenAlerta',
      value.origenAlerta
    );

  }


  if (value.casaHogar) {

    formData.append(
      'casaHogar',
      value.casaHogar
    );

  }


  if (value.ubicacionGps) {

    formData.append(
      'ubicacionGps',
      value.ubicacionGps
    );

  }


  // DENUNCIANTE

  formData.append(
    'denunciante',
    JSON.stringify({

      nombre:
        value.denunciante?.nombre || '',

      cui:
        value.denunciante?.cui || '',

      telefono:
        value.denunciante?.telefono || ''

    })
  );


  // LUGAR DE DESAPARICIÓN

  formData.append(
    'lugarDesaparicion',
    JSON.stringify({

      departamento:
        value.lugarDesaparicion
          ?.departamento || '',

      municipio:
        value.lugarDesaparicion
          ?.municipio || '',

      direccionDetallada:
        value.lugarDesaparicion
          ?.direccionDetallada || ''

    })
  );


  // DATOS DE LOCALIZACIÓN
  // Solo si corresponde

  if (
    value.estadoInvestigacion ===
    'Remitido'
  ) {

    const localizacion =
      value.datosLocalizacion;


    formData.append(
      'datosLocalizacion',
      JSON.stringify({

        direccionLocalizacion:
          localizacion
            ?.direccionLocalizacion || '',

        nombrePersonaConQuienEstaba:
          localizacion
            ?.nombrePersonaConQuienEstaba || '',

        telefono:
          localizacion
            ?.telefono || '',

        horaLocalizacion:
          localizacion
            ?.horaLocalizacion || '',

        fechaLocalizacion:
          localizacion?.fechaLocalizacion
            ? new Date(
                localizacion.fechaLocalizacion
              ).toISOString()
            : null

      })
    );

  }


  // PDF

  formData.append(
    'file',
    this.selectedFile,
    this.selectedFile.name
  );


  this.alertaService
    .registrarAlerta(formData)
    .subscribe({

      next: () => {

        if (this.informeDeic) {

          this.informeService
            .eliminar(
              this.informeDeic
            )
            .subscribe();

        }


        this._snackBar.open(
          'Caso registrado correctamente',
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['snack-success']
          }
        );


        this.resetFormState(
          this.myForm
        );


        sessionStorage.removeItem(
          this.draftKey
        );


        this.selectedFile = null;

        this.fileName = null;

        this.isLoading = false;

        this.informeDeic = null;

      },


      error: (error) => {

        this.isLoading = false;


        console.error(
          'Error al registrar alerta:',
          error
        );


        const backendMessage =
          error?.error?.message;


        const msg =
          Array.isArray(
            backendMessage
          )
            ? backendMessage.join(' ')
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
            value.numeroDeic || '';

          this.casoYaExiste = true;

          return;
        }


        this._snackBar.open(
          msg,
          'Cerrar',
          {
            duration: 5000,
            panelClass: ['snack-error']
          }
        );

      }

    });

}

  irASeguimiento() {
    this.router.navigate(['/casos/seguimiento-alerta'], {
      state: { numeroDeic: this.deicDuplicado }
    });
  }

  resetFormState(form: FormGroup) {
    form.reset();
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control instanceof FormGroup) {
        this.resetFormState(control);
      } else {
        control?.markAsPristine();
        control?.markAsUntouched();
        control?.setErrors(null);
      }
    });
  }

  private guardarBorradorLocal(): void {
    sessionStorage.setItem(this.draftKey, JSON.stringify({
      value: this.myForm.getRawValue(),
      fileName: this.fileName,
    }));
  }

  private restaurarBorradorLocal(): void {

  const raw =
    sessionStorage.getItem(
      this.draftKey
    );

  if (!raw) return;


  try {

    const draft =
      JSON.parse(raw);

    const value =
      draft.value || {};


    if (value.fecha_Nac) {

      value.fecha_Nac =
        new Date(
          value.fecha_Nac
        );

    }


    if (
      value.datosLocalizacion
        ?.fechaLocalizacion
    ) {

      value.datosLocalizacion
        .fechaLocalizacion =
          new Date(
            value.datosLocalizacion
              .fechaLocalizacion
          );

    }


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
        panelClass: ['snack-warning']
      }
    );

  } catch {

    sessionStorage.removeItem(
      this.draftKey
    );

  }

}
}
