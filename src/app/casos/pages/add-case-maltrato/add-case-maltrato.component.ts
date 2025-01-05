import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CommonModule } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-add-case-maltrato',
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
        CommonModule
  ],
  templateUrl: './add-case-maltrato.component.html',
  styleUrl: './add-case-maltrato.component.css'
})
export class AddCaseMaltratoComponent {

  foods = [
    {value: 'Informado', viewValue: 'Informado'},
    {value: 'Concluido', viewValue: 'Concluido'},
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
}
