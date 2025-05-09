import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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


@Component({
  selector: 'app-add-case-alerta',
  providers: [
    provideNativeDateAdapter(),
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './add-case-alerta.component.html',
  styleUrl: './add-case-alerta.component.css'
})
export default class AddCaseAlertaComponent {


  //Inyeccion de dependencias
  private formBuilder = inject(FormBuilder);
  private _snackBar = inject(MatSnackBar);
  private alertaService = inject(AlertaService);



  //variables
  isLoading = false;
  fileName: string | null = null;
  selectedFile: File | null = null;
  estados = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Concluido', viewValue: 'Concluido' },
    { value: 'Remitido', viewValue: 'Remitido' },
  ];



  myForm = this.formBuilder.group({
    numeroDeic: ['', [Validators.required, Validators.pattern(/^DEIC52-\d{4}-\d{2}-\d{2}-\d+$/)]],
    numeroMp: ['', [Validators.required, Validators.pattern(/^M0030-\d{4}-\d+$/)]],
    numeroAlerta: ['', [Validators.required, Validators.pattern(/^\d+-\d{4}$/)]],
    nombreDesaparecido: ['', [Validators.required]],
    fecha_Nac: [null, [Validators.required]],
    estadoInvestigacion: ['', [Validators.required]],
    direccion: this.formBuilder.group({
      departamento: ['', [Validators.required]],
      municipio: ['', [Validators.required]],
      direccionDetallada: ['', [Validators.required]],
    }),
    direccionLocalizacion: [''],
    nombreAcompanante: [''],
    telefono: [''],
    horaLocalizacion: [''],
    fechaLocalizacion: [null],
    fileUrls: this.formBuilder.array([]),
  });

  ngOnInit() {
    this.myForm.get('estadoInvestigacion')?.valueChanges.subscribe((estado) => {
      const mostrar = estado === 'Remitido';

      const campos = [
        'direccionLocalizacion',
        'nombreAcompanante',
        'telefono',
        'horaLocalizacion',
        'fechaLocalizacion'
      ];

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

    //precargar datos de la caratula
    const datos = history.state;

    if (datos && datos.numeroDeic) {
      this.myForm.patchValue({
        numeroDeic: datos.numeroDeic,
        numeroMp: datos.numeroMp,
        numeroAlerta: datos.numeroAlerta,
        nombreDesaparecido: datos.nombre,
        fecha_Nac: datos.fecha_Nac,
        direccion: {
          departamento: datos.departamento || '',
          municipio: datos.municipio || '',
          direccionDetallada: datos.lugar || ''
        }
      });
    }
  }



  registrarCaso() {
    if (this.myForm.invalid || !this.selectedFile) {
      this._snackBar.open('Debes completar todos los campos y seleccionar un archivo', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('numeroDeic', this.myForm.value.numeroDeic || '');
    formData.append('numeroMp', this.myForm.value.numeroMp || '');
    formData.append('numeroAlerta', this.myForm.value.numeroAlerta || '');
    formData.append('nombreDesaparecido', this.myForm.value.nombreDesaparecido || '');
    formData.append('fecha_Nac', this.myForm.value.fecha_Nac || '');
    formData.append('estadoInvestigacion', this.myForm.value.estadoInvestigacion || '');
    formData.append('direccion[departamento]', this.myForm.value.direccion?.departamento || '');
    formData.append('direccion[municipio]', this.myForm.value.direccion?.municipio || '');
    formData.append('direccion[direccionDetallada]', this.myForm.value.direccion?.direccionDetallada || '');
    formData.append('file', this.selectedFile);
    if (this.myForm.value.estadoInvestigacion === 'Remitido') {
      formData.append('direccionLocalizacion', this.myForm.value.direccionLocalizacion || '');
      formData.append('nombreAcompanante', this.myForm.value.nombreAcompanante || '');
      formData.append('telefono', this.myForm.value.telefono || '');
      formData.append('horaLocalizacion', this.myForm.value.horaLocalizacion || '');
      formData.append('fechaLocalizacion', this.myForm.value.fechaLocalizacion || '');
    }

    this.alertaService.registrarAlerta(formData).subscribe({
      next: (response) => {
        this._snackBar.open('Caso registrado correctamente', 'cerrado', { duration: 3000 });
        console.log('Respuesta del servidor', response);

        this.resetFormState(this.myForm);
        this.selectedFile = null;
        this.isLoading = false;
      },
      error: (error) => {
        this._snackBar.open('Error al registrar el caso', 'cerrar', { duration: 3500 });
        console.log('Error al registrar el caso de alerta', error.message);
        this.isLoading = false;
      },
      complete: () => {
        console.log('La operación de registro de caso ha finalizado.');
      }
    });
  }



  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;
      console.log('Archivo seleccionado:', this.selectedFile);
    } else {
      this.selectedFile = null;
      this.fileName = null;
    }
  }



  resetFormState(form: FormGroup) {
    form.reset();

    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);

      if (control instanceof FormGroup) {
        this.resetFormState(control); // Recursivo para subgrupos
      } else {
        control?.markAsPristine();
        control?.markAsUntouched();
        control?.setErrors(null);
      }
    });
  }



}
