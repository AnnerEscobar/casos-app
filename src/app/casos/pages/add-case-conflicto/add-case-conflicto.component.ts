import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ConflictoService } from '../../services/conflicto.service';

@Component({
  selector: 'app-add-case-conflicto',
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
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-case-conflicto.component.html',
  styleUrl: './add-case-conflicto.component.css'
})
export default class AddCaseConflictoComponent {


  //Inyeccion de dependencias
  private formBuider = inject(FormBuilder);
  private conflictoService = inject(ConflictoService);
  private _snackBar = inject(MatSnackBar);


  //Arrays
  estados = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Concluido', viewValue: 'Concluido' },
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
      nombre: [' ', Validators.required],
      edad: [' ', Validators.required],
      direccion: [' ', Validators.required],
      cui: [' ', Validators.required],
    });
    this.victimas.push(victimaForm);
  }



  //metod para eliminar victimas
  eliminarVictima(index: number) {
    this.victimas.removeAt(index);
  }


  //metodo para registrar caso
  registrarCaso() {

    if (this.myForm.valid && this.selectedFile) {
      const formData = new FormData();

      this.isLoading = true;
      formData.append('numeroDeic', this.myForm.value.numeroDeic || '');
      formData.append('numeroMp', this.myForm.value.numeroMp || '');
      formData.append('estadoInvestigacion', this.myForm.value.estadoInvestigacion || '');
      formData.append('infractores', JSON.stringify(this.myForm.value.infractores));
      formData.append('victimas', JSON.stringify(this.myForm.value.victimas));
      formData.append('file', this.selectedFile)

      this.conflictoService.registrarConflicto(formData)
        .subscribe({
          next: (response) => {
            this._snackBar.open('Caso registrado con exito', 'Cerrar', { duration: 3000 });
            console.log('Respuesta del servidor', response);

            this.resetFormState(this.myForm);
            this.selectedFile = null;
            this.isLoading = false;
            console.log('datos del formulario', this.myForm.value);
          },
          error:(error) => {
            this._snackBar.open('Error al registrar el caso', 'Cerrar', { duration: 3500 });
            console.log('Error al registrar el caso', error);
            this.isLoading = false;
            console.log('datos del formulario', this.myForm.value);
          },
          complete: () => {
            console.log('Operacion finalizada con exito');
          }
        }
        )
    }
  }



  resetFormState(formulario: FormGroup) {
    formulario.reset()
    formulario.markAsPristine();
    formulario.markAsUntouched();
  }


}
