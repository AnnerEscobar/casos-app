import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaltratoService } from './../../services/maltrato.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { InformeService } from '../../../informes/services/informe.service';

@Component({
  selector: 'app-add-case-maltrato',
  providers: [provideNativeDateAdapter()],
  imports: [
    MatFormFieldModule, MatSelectModule, ReactiveFormsModule,
    MatSlideToggleModule, MatInputModule, MatIconModule,
    MatButtonModule, MatDatepickerModule, CommonModule,
    MatProgressSpinnerModule, MatCardModule, MatTooltipModule
  ],
  templateUrl: './add-case-maltrato.component.html',
  styleUrls: ['./add-case-maltrato.component.css'],
})
export default class AddCaseMaltratoComponent implements OnInit {

  private formBuider = inject(FormBuilder);
  private maltratoService = inject(MaltratoService);
  private informeService = inject(InformeService);
  private _snackBar = inject(MatSnackBar);
  private router = inject(Router);

  estados = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Desestimado', viewValue: 'Desestimado' },
  ];

  isLoading = false;
  fileName: string | null = null;
  selectedFile: File | null = null;
  informeDeic: string | null = null;
  casoYaExiste = false;
  deicDuplicado = '';
  private readonly draftKey = 'draft:add-case-maltrato';

myForm = this.formBuider.group({

  numeroDeic: [
    '',
    [
      Validators.required,
      Validators.pattern(
        /^DEIC51-\d{4}-\d{2}-\d{2}-\d+$/
      )
    ]
  ],

 numeroMp: [
  '',
  [
    Validators.required,
    Validators.pattern(
      /^(?:(?:MPE01|M0008|MP004|M0030|MP001)-\d{4}-\d+|IC\/PNCORLLAT\d+-\d{4}-\d+)$/
    )
  ]
],

  estadoInvestigacion: [
    '',
    Validators.required
  ],

  // Lo mantenemos con este nombre internamente
  // para no romper tus métodos actuales.
  infractores:
    this.formBuider.array([]),

  victimas:
    this.formBuider.array([]),

  lugarHechos:
    this.formBuider.group({

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

  get infractores(): FormArray<FormGroup> {
    return this.myForm.get('infractores') as FormArray;
  }

  get victimas(): FormArray<FormGroup> {
    return this.myForm.get('victimas') as FormArray;
  }

  ngOnInit(): void {
    this.agregarInfractor();
    this.agregarVictima();

    const datos = history.state;

    if (datos?.informe) {
      const inf = datos.informe;
      this.informeDeic = inf.numeroDeic;

      this.myForm.patchValue({
        numeroDeic: inf.numeroDeic,
        numeroMp: inf.numeroMp,
      });

      const s = inf.perfilSecundario || {};
      (this.infractores.at(0) as FormGroup).patchValue({
        nombre: s.nombre || '',
        cui: s.documentoIdentificacion || '',
        fecha_Nac: s.fechaNacimiento ? new Date(s.fechaNacimiento) : null,
        direccion: s.residencia || '',
      });

      const v = inf.perfilVictima || {};
      (this.victimas.at(0) as FormGroup).patchValue({
        nombre: v.nombre || '',
        fecha_Nac: v.fechaNacimiento ? new Date(v.fechaNacimiento) : null,
        direccion: v.residencia || '',
        cui: '',
      });

    } else if (datos?.numeroDeic) {
      this.myForm.patchValue({
        numeroDeic: datos.numeroDeic,
        numeroMp: datos.numeroMp,
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
  this.fileName = file.name;

}

 agregarInfractor(): void {

  this.infractores.push(
    this.formBuider.group({

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

}

eliminarInfractor(index: number): void {

  if (
    this.infractores.length > 1
  ) {
    this.infractores.removeAt(index);
  }

}

  agregarVictima(): void {

  this.victimas.push(
    this.formBuider.group({

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

}

eliminarVictima(index: number): void {

  if (
    this.victimas.length > 1
  ) {
    this.victimas.removeAt(index);
  }

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


  // --------------------------------
  // Datos generales
  // --------------------------------

  formData.append(
    'numeroDeic',
    value.numeroDeic?.trim() || ''
  );

  formData.append(
    'numeroMp',
    value.numeroMp?.trim() || ''
  );

  formData.append(
    'estadoInvestigacion',
    value.estadoInvestigacion || ''
  );


  // --------------------------------
  // Sindicados
  // --------------------------------

  const sindicados =
    (value.infractores || [])
      .map((persona: any) => ({

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

      }));


  formData.append(
    'sindicados',
    JSON.stringify(sindicados)
  );


  // --------------------------------
  // Víctimas
  // --------------------------------

  const victimas =
    (value.victimas || [])
      .map((persona: any) => ({

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

      }));


  formData.append(
    'victimas',
    JSON.stringify(victimas)
  );


  // --------------------------------
  // Lugar de los hechos
  // --------------------------------

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


  // --------------------------------
  // PDF
  // --------------------------------

  formData.append(
    'file',
    this.selectedFile,
    this.selectedFile.name
  );


  this.maltratoService
    .sendFormData(formData)
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
          'Caso registrado con éxito',
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['snack-success']
          }
        );


        sessionStorage.removeItem(
          this.draftKey
        );


        this.selectedFile = null;
        this.fileName = null;
        this.informeDeic = null;
        this.isLoading = false;


        // Limpiar correctamente FormArrays
        this.infractores.clear();
        this.victimas.clear();

        this.myForm.reset();

        this.agregarInfractor();
        this.agregarVictima();

      },


      error: (error) => {

        this.isLoading = false;


        console.error(
          'Error al registrar maltrato:',
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
    this.router.navigate(['/casos/seguimiento-maltrato'], {
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

  sessionStorage.setItem(
    this.draftKey,
    JSON.stringify({

      value:
        this.myForm.getRawValue(),

      fileName:
        this.fileName

    })
  );

}

private restaurarBorradorLocal(): void {

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
      (value.infractores || [])
        .map((item: any) => ({

          ...item,

          fecha_Nac:
            item.fecha_Nac
              ? new Date(
                  item.fecha_Nac
                )
              : null

        }));


    value.victimas =
      (value.victimas || [])
        .map((item: any) => ({

          ...item,

          fecha_Nac:
            item.fecha_Nac
              ? new Date(
                  item.fecha_Nac
                )
              : null

        }));


    this.infractores.clear();

    this.victimas.clear();


    (
      value.infractores.length
        ? value.infractores
        : [{}]
    ).forEach(
      () => this.agregarInfractor()
    );


    (
      value.victimas.length
        ? value.victimas
        : [{}]
    ).forEach(
      () => this.agregarVictima()
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
