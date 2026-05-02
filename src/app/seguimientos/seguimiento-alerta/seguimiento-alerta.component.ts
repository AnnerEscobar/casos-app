import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { SeguimientoAlertaService } from '../seguimiento-services/seguimiento-alerta.service';

@Component({
  selector: 'app-seguimiento-alerta',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './seguimiento-alerta.component.html',
  styleUrl: './seguimiento-alerta.component.css'
})
export default class SeguimientoAlertaComponent implements OnInit {

  seguimientoForm!: FormGroup;
  casoEncontrado: any = null;
  files: File[] = [];
  fileName: string | null = null;
  searching = false;
  submitting = false;

  estados = [
    { value: 'Informado', label: 'Informado' },
    { value: 'Remitido',  label: 'Remitido'  },
    { value: 'Concluido', label: 'Concluido' },
  ];

  constructor(
    private fb: FormBuilder,
    private sgicService: SeguimientoAlertaService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.seguimientoForm = this.fb.group({
      numeroDeic:  ['', Validators.required],
      nuevoEstado: ['Informado', Validators.required],
      acompanante: [''],
      telefono:    [''],
      direccion:   [''],
    });

    this.seguimientoForm.get('nuevoEstado')?.valueChanges.subscribe(estado => {
      const campos = ['acompanante', 'telefono', 'direccion'];
      campos.forEach(campo => {
        const control = this.seguimientoForm.get(campo);
        if (estado === 'Remitido') {
          control?.setValidators(Validators.required);
        } else {
          control?.clearValidators();
          control?.setValue('');
        }
        control?.updateValueAndValidity();
      });
    });

    const state = history.state;
    if (state?.numeroDeic) {
      this.seguimientoForm.patchValue({ numeroDeic: state.numeroDeic });
      this.buscarCaso();
    }
  }

  onFileChange(event: any) {
    const f: File[] = Array.from(event.target.files);
    if (f.length) {
      this.files = f;
      this.fileName = f.map(x => x.name).join(', ');
    }
  }

  buscarCaso() {
    const deic = this.seguimientoForm.value.numeroDeic?.trim();
    if (!deic) return;
    this.searching = true;
    this.casoEncontrado = null;
    this.sgicService.getCasoPorDeic(deic).subscribe({
      next: (data) => {
        this.casoEncontrado = data;
        this.searching = false;
      },
      error: () => {
        this.searching = false;
        this.snackBar.open('No se encontró el caso con ese número DEIC.', 'Cerrar', {
          duration: 4000, panelClass: ['snack-error']
        });
      }
    });
  }

  get esRemitido(): boolean {
    return this.seguimientoForm.get('nuevoEstado')?.value === 'Remitido';
  }

  enviarSeguimiento() {
    if (!this.seguimientoForm.valid || !this.casoEncontrado) return;

    this.submitting = true;
    const formData = new FormData();
    this.files.forEach(f => formData.append('files', f));
    formData.append('nuevoEstado', this.seguimientoForm.value.nuevoEstado);

    if (this.esRemitido) {
      formData.append('nombreAcompanante', this.seguimientoForm.value.acompanante || '');
      formData.append('telefono', this.seguimientoForm.value.telefono || '');
      formData.append('direccionLocalizacion', this.seguimientoForm.value.direccion || '');
    }

    const deic = this.casoEncontrado.numeroDeic || this.seguimientoForm.value.numeroDeic?.trim();
    this.sgicService.enviarSeguimientoAlerta(deic, formData).subscribe({
      next: () => {
        this.snackBar.open('Seguimiento registrado correctamente.', 'Cerrar', {
          duration: 3000, panelClass: ['snack-success']
        });
        this.seguimientoForm.reset({ nuevoEstado: 'Informado' });
        this.files = [];
        this.fileName = null;
        this.casoEncontrado = null;
        this.submitting = false;
      },
      error: () => {
        this.snackBar.open('Error al registrar el seguimiento.', 'Cerrar', {
          duration: 3000, panelClass: ['snack-error']
        });
        this.submitting = false;
      }
    });
  }
}
