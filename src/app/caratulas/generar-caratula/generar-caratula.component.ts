import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CaratulaService } from '../caratula.service';

@Component({
  selector: 'app-generar-caratula',
  imports: [
    ReactiveFormsModule, CommonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './generar-caratula.component.html',
  styleUrl: './generar-caratula.component.css'
})
export default class GenerarCaratulaComponent implements OnInit {

  caratulaForm!: FormGroup;
  isLoading = false;

  private fb             = inject(FormBuilder);
  private caratulaService = inject(CaratulaService);
  private snackBar       = inject(MatSnackBar);

  ngOnInit() {
    this.caratulaForm = this.fb.group({
      tipoCaso:      ['', Validators.required],
      numeroDeic:    ['', Validators.required],
      numeroMp:      ['', Validators.required],
      numeroAlerta:  [''],
      nombre:        ['', Validators.required],
      lugar:         ['', Validators.required],
      observaciones: ['', Validators.required],
      investigador:  ['', Validators.required],
    });
  }

  get esAlerta(): boolean {
    return this.caratulaForm.get('tipoCaso')?.value === 'Alerta';
  }

  generarCaratula() {
    if (this.caratulaForm.invalid) {
      this.snackBar.open('Por favor completa todos los campos obligatorios.', 'Cerrar', {
        duration: 3000, panelClass: ['snack-warning']
      });
      return;
    }

    this.isLoading = true;
    const datos = this.caratulaForm.value;

    const caratula = {
      tipoCaso:      datos.tipoCaso,
      numeroDeic:    datos.numeroDeic,
      numeroMp:      datos.numeroMp,
      numeroAlerta:  datos.numeroAlerta,
      nombre:        datos.nombre,
      lugar:         datos.lugar,
      observaciones: datos.observaciones,
      investigador:  datos.investigador,
    };

    this.caratulaService.crearCaratulaPendiente(caratula).subscribe({
      next: () => {
        this.snackBar.open('Carátula guardada. Generando PDF...', 'Cerrar', {
          duration: 2500, panelClass: ['snack-success']
        });

        this.caratulaService.generarPDF(caratula).subscribe({
          next: (pdfBlob) => {
            const blob = new Blob([pdfBlob], { type: 'application/pdf' });
            const url  = window.URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `Caratula-${datos.numeroDeic}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            this.isLoading = false;
            this.snackBar.open('PDF generado con éxito.', 'Cerrar', {
              duration: 3000, panelClass: ['snack-success']
            });
            this.caratulaForm.reset();
          },
          error: () => {
            this.isLoading = false;
            this.snackBar.open('Carátula guardada, pero falló la generación del PDF.', 'Cerrar', {
              duration: 4000, panelClass: ['snack-warning']
            });
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Ocurrió un error al guardar la carátula.', 'Cerrar', {
          duration: 4000, panelClass: ['snack-error']
        });
      }
    });
  }
}
