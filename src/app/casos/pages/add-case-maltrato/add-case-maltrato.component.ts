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
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-add-case-maltrato',
  providers: [
    provideNativeDateAdapter()
  ],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './add-case-maltrato.component.html',
  styleUrl: './add-case-maltrato.component.css'
})
export default class AddCaseMaltratoComponent implements OnInit{

  ngOnInit(): void {
    this.agregarInfractor();
    this.agregarVictima();
  }

  //Inyeccion de dependencias
  private formBuider = inject(FormBuilder);
  private maltratoService = inject(MaltratoService);
  private _snackBar = inject(MatSnackBar);

  estados = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Desestimado', viewValue: 'Desestimado' },
  ];

  //variables
  isLoading = false;
  fileName: string | null = null;
  selectedFile: File | null = null;


  //metodo para seleccionar un archvio
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;
    } else {
      this.selectedFile = null;
      this.fileName = null;
    }
  }

  //formbuilder
  myForm = this.formBuider.group({
    numeroDeic: ['', [Validators.required]],
    numeroMp: ['', [Validators.required]],
    estadoInvestigacion: ['', [Validators.required]],
    infractores: this.formBuider.array([]),
    victimas: this.formBuider.array([]),
    fileUrls: this.formBuider.array([]),
  });

  // Getters para acceder a los FormArrays
  get infractores(): FormArray<FormGroup> {
    return this.myForm.get('infractores') as FormArray;
  }

  get victimas(): FormArray<FormGroup> {
    return this.myForm.get('victimas') as FormArray;
  }

  // Métodos para manejar los infractores
  agregarInfractor() {
    const infractorForm = this.formBuider.group({
      nombre: ['', Validators.required],
      cui: ['', Validators.required],
      fecha_Nac: ['', Validators.required],
      direccion: ['', Validators.required],
    });
    this.infractores.push(infractorForm);
  }

  //metodos para eliminar infractores
  eliminarInfractor(index: number) {
    this.infractores.removeAt(index);
  }

  // Métodos para manejar las víctimas
  agregarVictima() {
    const victimaForm = this.formBuider.group({
      nombre: ['', Validators.required],
      fecha_Nac: ['', Validators.required],
      direccion: ['', Validators.required],
      cui: ['', Validators.required],
    });
    this.victimas.push(victimaForm);
  }

  //metod para eliminar victimas
  eliminarVictima(index: number) {
    this.victimas.removeAt(index);
  }

  //metodo para registrar caso
  registrarCaso() {

    if (this.myForm.invalid || !this.selectedFile) {
      this._snackBar.open('Debes completar todos los campos y seleccionar un archivo', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('numeroDeic', this.myForm.value.numeroDeic?.trim() || '');
    formData.append('numeroMp', this.myForm.value.numeroMp?.trim() || '');
    formData.append('estadoInvestigacion', this.myForm.value.estadoInvestigacion || '');

    this.myForm.value.infractores?.forEach((infractor: any, index: number) => {
      formData.append(`infractores[${index}][nombre]`, infractor.nombre);
      formData.append(`infractores[${index}][cui]`, infractor.cui);
      formData.append(`infractores[${index}][fecha_Nac]`, infractor.fecha_Nac);
      formData.append(`infractores[${index}][direccion]`, infractor.direccion);
    });

    this.myForm.value.victimas?.forEach((victima: any, index: number) => {
      formData.append(`victimas[${index}][nombre]`, victima.nombre);
      formData.append(`victimas[${index}][fecha_Nac]`, victima.fecha_Nac);
      formData.append(`victimas[${index}][direccion]`, victima.direccion);
      formData.append(`victimas[${index}][cui]`, victima.cui);
    });

    formData.append('file', this.selectedFile)

    console.log('formData', formData);
    console.log('datos del formulario', this.myForm.value);
    this.maltratoService.sendFormData(formData)
      .subscribe({
        next: (response) => {
          this._snackBar.open('Caso registrado con exito', 'Cerrar', { duration: 3000 });
          this.resetFormState(this.myForm);
          this.selectedFile = null;
          this.isLoading = false;
        },
        error: (error) => {
          this._snackBar.open('Error al registrar el caso', 'Cerrar', { duration: 3000 });
        }
      }
      )
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
