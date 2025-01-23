import { MaltratoService } from './../../services/maltrato.service';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    CommonModule
  ],
  templateUrl: './add-case-maltrato.component.html',
  styleUrl: './add-case-maltrato.component.css'
})
export default class AddCaseMaltratoComponent {

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
      console.log('Archivo seleccionado:', this.selectedFile);
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
      fechaNacimiento: ['', Validators.required],
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
      edad: ['', Validators.required],
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
      console.log(this.myForm.status)
      console.log('Erorr en el formulario');
      this._snackBar.open('Debes completar todos los campos y seleccionar un archivo', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('numeroDeic', this.myForm.value.numeroDeic || '');
    formData.append('numeroMp', this.myForm.value.numeroMp || '');
    formData.append('estadoInvestigacion', this.myForm.value.estadoInvestigacion || '');
    formData.append('infractores', JSON.stringify(this.myForm.value.infractores));
    formData.append('victimas', JSON.stringify(this.myForm.value.victimas));
    formData.append('file', this.selectedFile)

    this.maltratoService.sendFormData(formData)
      .subscribe(
        (response: any) => {
          console.log('Caso registrado con exito', response);
          console.log(this.myForm.value);
          console.log('ESte es el archvio seleccionado', this.selectedFile);
          this.resetFormState(this.myForm);
          this.selectedFile = null;
          this.isLoading = false;
        },
        (error: any) => {
          console.error('Error al registrar el caso', error)
          console.log(this.myForm.value)
        }
      )
  }

  resetFormState(formulario: FormGroup) {
    formulario.reset()
    formulario.markAsPristine();
    formulario.markAsUntouched();
  }

}
