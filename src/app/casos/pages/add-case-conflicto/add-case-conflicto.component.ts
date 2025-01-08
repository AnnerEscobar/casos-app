
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-case-conflicto',
  providers:[
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
    FormsModule
  ],
  templateUrl: './add-case-conflicto.component.html',
  styleUrl: './add-case-conflicto.component.css'
})
export default class AddCaseConflictoComponent {

  foods = [
    { value: 'Informado', viewValue: 'Informado' },
    { value: 'Concluido', viewValue: 'Concluido' },
  ];

  fileName: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName = file.name;
      console.log('Archivo seleccionado:', file);
    }
  }

  victimas: { nombre: string; edad: number; direccion: string; cui: string }[] = [
    { nombre: '', edad: 0, direccion: '', cui: '' },
  ];

  infractores: { nombre: string; cui: string; fechaNacimiento: Date | null; direccion: string }[] = [
    { nombre: '', cui: '', fechaNacimiento: null, direccion: '' },
  ];

  // Métodos para manejar víctimas
  agregarVictima() {
    this.victimas.push({ nombre: '', edad: 0, direccion: '', cui: '' });
  }

  eliminarVictima(index: number) {
    this.victimas.splice(index, 1);
  }

  // Métodos para manejar infractores
  agregarInfractor() {
    this.infractores.push({ nombre: '', cui: '', fechaNacimiento: null, direccion: '' });
  }

  eliminarInfractor(index: number) {
    this.infractores.splice(index, 1);
  }

}
