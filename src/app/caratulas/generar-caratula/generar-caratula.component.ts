import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CaratulaService } from './caratula.service';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-generar-caratula',
  imports: [MatCardModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, CommonModule, MatButtonModule],
  templateUrl: './generar-caratula.component.html',
  styleUrl: './generar-caratula.component.css'
})
export default class GenerarCaratulaComponent {


  caratulaForm!: FormGroup; // Declaración sin inicializar

  constructor(private fb: FormBuilder, private caratulaService: CaratulaService) {}

  ngOnInit() {
    this.caratulaForm = this.fb.group({
      tipoCaso: ['', Validators.required],
      numeroDeic: ['', Validators.required],
      numeroMp: ['', Validators.required],
      numeroAlerta: [''],
      nombre: ['', Validators.required],
      lugar: ['', Validators.required],
      observaciones: ['', Validators.required],
      investigador: ['', Validators.required]
    });
  }

  generarCaratula() {
    const data = this.caratulaForm.value;

    this.caratulaService.generarPDF(data).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caratula-${data.numeroDeic}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }


}
