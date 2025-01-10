import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';


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
  ],
  templateUrl: './add-case-alerta.component.html',
  styleUrl: './add-case-alerta.component.css'
})
export default class AddCaseAlertaComponent {

  //Inyeccion de dependencias
  private formBuilder = inject(FormBuilder);

  //variables
  fileName: string | null = null;
  estados = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Concluido', viewValue: 'Concluido' },
    { value: 'Remitido', viewValue: 'Remitido' },
  ];


  myForm = this.formBuilder.group({
    numeroDeic: ['', [Validators.required]],
    numeroMp: ['', [Validators.required]],
    numeroAlerta: ['', [Validators.required]],
    nombreDesaparecido: ['', [Validators.required]],
    fecha_Nac: [null, [Validators.required]],
    estadoInvestigacion: ['', [Validators.required]],
    direccion: this.formBuilder.group({
      departamento: ['', [Validators.required]],
      municipio: ['', [Validators.required]],
      direccionDetallada: ['', [Validators.required]],
    }),
    fileUrls: this.formBuilder.array([])
  });

  registrarCaso(){
    console.log(this.myForm.value)
    console.log(this.fileName)
  }


  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName = file.name;
      console.log('Archivo seleccionado:', file);
    }
  }

}
