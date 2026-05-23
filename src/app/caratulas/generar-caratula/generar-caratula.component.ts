import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { HttpErrorResponse } from '@angular/common/http';

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
      numeroDeic:    ['', [Validators.required, this.numeroDeicValidator()]],
      numeroMp:      ['', [Validators.required, this.numeroMpValidator()]],
      numeroAlerta:  [''],
      nombre:        ['', Validators.required],
      edad:          ['', this.edadValidator()],
      lugar:         ['', Validators.required],
      observaciones: ['', Validators.required],
      investigador:  ['', Validators.required],
    });

    this.caratulaForm.get('tipoCaso')?.valueChanges.subscribe(() => {
      this.caratulaForm.get('numeroDeic')?.updateValueAndValidity();
      this.caratulaForm.get('numeroMp')?.updateValueAndValidity();
      this.caratulaForm.get('edad')?.updateValueAndValidity();
    });

    this.caratulaForm.get('nombre')?.valueChanges.subscribe(() => {
      this.caratulaForm.get('edad')?.updateValueAndValidity();
    });
  }

  get esAlerta(): boolean {
    return this.caratulaForm.get('tipoCaso')?.value === 'Alerta';
  }

  get lugarLabel(): string {
    return this.esAlerta ? 'Lugar de desaparicion' : 'Lugar de los hechos';
  }

  generarCaratula() {
    if (this.caratulaForm.invalid) {
      this.caratulaForm.markAllAsTouched();
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
      edad:          datos.edad,
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
          error: (error) => {
            this.isLoading = false;
            this.snackBar.open(this.getErrorMessage(error, 'Carátula guardada, pero falló la generación del PDF.'), 'Cerrar', {
              duration: 4000, panelClass: ['snack-warning']
            });
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        if (this.isFormatoDeicError(error)) {
          this.caratulaForm.get('numeroDeic')?.setErrors({ numeroDeicFormato: true });
          this.caratulaForm.get('numeroDeic')?.markAsTouched();
        }
        if (this.isFormatoMpError(error)) {
          this.caratulaForm.get('numeroMp')?.setErrors({ numeroMpFormato: true });
          this.caratulaForm.get('numeroMp')?.markAsTouched();
        }
        this.snackBar.open(this.getErrorMessage(error, 'Ocurrió un error al guardar la carátula.'), 'Cerrar', {
          duration: 4000, panelClass: ['snack-error']
        });
      }
    });
  }

  get numeroDeicHelp(): string {
    const tipoCaso = this.caratulaForm?.get('tipoCaso')?.value;

    if (tipoCaso === 'Alerta') return 'Formato: DEIC52-AAAA-MM-DD-### o AK000001';
    if (tipoCaso === 'Maltrato') return 'Formato: DEIC51-AAAA-MM-DD-### o MT000001';
    if (tipoCaso === 'Conflicto') return 'Formato: DEIC53-AAAA-MM-DD-### o AC000001';

    return 'Selecciona primero el tipo de caso.';
  }

  get numeroMpHelp(): string {
    const tipoCaso = this.caratulaForm?.get('tipoCaso')?.value;

    if (tipoCaso === 'Alerta') return 'Formato: M0030-AAAA-###';
    if (tipoCaso === 'Maltrato') return 'Formato: MPE01, M0008, MP004, M0030, MP001 o IC/PNCORLLAT###-AAAA-###';
    if (tipoCaso === 'Conflicto') return 'Formato: M0004-AAAA-###, MP001-AAAA-### o MPE01-AAAA-###';

    return 'Ingresa el numero de expediente MP.';
  }

  private numeroDeicValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const numero = String(control.value ?? '').trim().toUpperCase();
      const tipoCaso = this.caratulaForm?.get('tipoCaso')?.value;

      if (!numero || !tipoCaso) {
        return null;
      }

      const patterns: Record<string, RegExp> = {
        Alerta: /^(?:DEIC52-\d{4}-\d{2}-\d{2}-\d+|AK\d{6})$/,
        Maltrato: /^(?:DEIC51-\d{4}-\d{2}-\d{2}-\d+|MT\d{6})$/,
        Conflicto: /^(?:DEIC53-\d{4}-\d{2}-\d{2}-\d+|AC\d{6})$/,
      };

      return patterns[tipoCaso]?.test(numero) ? null : { numeroDeicFormato: true };
    };
  }

  private numeroMpValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const numero = String(control.value ?? '').trim().toUpperCase();
      const tipoCaso = this.caratulaForm?.get('tipoCaso')?.value;

      if (!numero || !tipoCaso) {
        return null;
      }

      const patterns: Record<string, RegExp> = {
        Alerta: /^M0030-\d{4}-\d+$/,
        Maltrato: /^(?:(?:MPE01|M0008|MP004|M0030|MP001)-\d{4}-\d+|IC\/PNCORLLAT\d+-\d{4}-\d+)$/,
        Conflicto: /^(?:M0004|MP001|MPE01)-\d{4}-\d+$/,
      };

      const pattern = patterns[tipoCaso];
      return !pattern || pattern.test(numero) ? null : { numeroMpFormato: true };
    };
  }

  private edadValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const tipoCaso = this.caratulaForm?.get('tipoCaso')?.value;
      const edad = String(control.value ?? '').trim();

      if (!tipoCaso) {
        return null;
      }

      if (!edad) {
        return { required: true };
      }

      if (tipoCaso === 'Alerta') {
        return /^\d{1,2}$/.test(edad) ? null : { edadFormato: true };
      }

      if (!/^\d{1,2}(?:\s*,\s*\d{1,2})*$/.test(edad)) {
        return { edadFormato: true };
      }

      const nombres = String(this.caratulaForm?.get('nombre')?.value ?? '')
        .split(',')
        .map((nombre) => nombre.trim())
        .filter(Boolean);
      const edades = edad.split(',').map((item) => item.trim()).filter(Boolean);

      return nombres.length > 0 && nombres.length !== edades.length ? { edadCantidad: true } : null;
    };
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.message;

      if (Array.isArray(backendMessage)) {
        return backendMessage.join(' ');
      }

      if (typeof backendMessage === 'string') {
        return backendMessage;
      }

      if (typeof error.error?.error === 'string') {
        return error.error.error;
      }
    }

    return fallback;
  }

  private isFormatoDeicError(error: unknown): boolean {
    return this.getErrorMessage(error, '').includes('Formato permitido: DEIC');
  }

  private isFormatoMpError(error: unknown): boolean {
    return this.getErrorMessage(error, '').includes('Formato MP permitido');
  }
}
