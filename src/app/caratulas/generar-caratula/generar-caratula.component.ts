import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CaratulaService } from '../caratula.service';

@Component({
  selector: 'app-generar-caratula',
  imports: [MatCardModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, CommonModule, MatButtonModule],
  templateUrl: './generar-caratula.component.html',
  styleUrl: './generar-caratula.component.css'
})
export default class GenerarCaratulaComponent {


  caratulaForm!: FormGroup; // Declaración sin inicializar

  constructor(private fb: FormBuilder, private caratulaService: CaratulaService, private _snackBar: MatSnackBar) { }

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
    if (this.caratulaForm.invalid) {
      this._snackBar.open('Por favor llena todos los campos obligatorios.', 'Cerrar');
      return;
    }

    const datos = this.caratulaForm.value;

    const caratula = {
      tipoCaso: datos.tipoCaso,
      numeroDeic: datos.numeroDeic,
      numeroMp: datos.numeroMp,
      numeroAlerta: datos.numeroAlerta,
      nombre: datos.nombre,
      fecha_Nac: datos.fecha_Nac,
      lugar: datos.lugar,
      departamento: datos.departamento,
      municipio: datos.municipio,
      observaciones: datos.observaciones,
      investigador: datos.investigador
    };

    this.caratulaService.crearCaratulaPendiente(caratula).subscribe({
      next: () => {
        this._snackBar.open('Carátula guardada correctamente, generando PDF...', 'Cerrar', { duration: 2500 });

        this.caratulaService.generarPDF(caratula).subscribe({
          next: (pdfBlob) => {
            const blob = new Blob([pdfBlob], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Caratula-${datos.numeroDeic}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);

            this._snackBar.open('PDF generado con éxito.', 'Cerrar', { duration: 3000 });
            this.caratulaForm.reset();
          },
          error: (err) => {
            console.error('Error al generar PDF:', err);
            this._snackBar.open('Carátula guardada, pero falló la generación del PDF.', 'Cerrar', { duration: 3000 });
          }
        });

      },
      error: (err) => {
        console.error('Error al guardar carátula:', err);
        this._snackBar.open('Ocurrió un error al guardar la carátula.', 'Cerrar', { duration: 3000 });
      }
    });
  }



}

