import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { SeguimientoMaltratoService } from '../seguimiento-services/seguimiento-maltrato.service';

@Component({
  selector: 'app-seguimiento-maltrato',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './seguimiento-maltrato.component.html',
  styleUrl: './seguimiento-maltrato.component.css'
})
export default class SeguimientoMaltratoComponent implements OnInit {

  seguimientoForm!: FormGroup;
  casoEncontrado: any = null;
  files: File[] = [];
  fileName: string | null = null;
  searching = false;
  submitting = false;

  estados = [
    { value: 'Informado',   label: 'Informado'   },
    { value: 'Desestimado', label: 'Desestimado' },
  ];

  constructor(
    private fb: FormBuilder,
    private seguimientoService: SeguimientoMaltratoService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.seguimientoForm = this.fb.group({
      numeroDeic: ['', Validators.required],
      nuevoEstado: ['Informado', Validators.required],
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
    this.seguimientoService.buscarCasoPorDeic(deic).subscribe({
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

  enviarSeguimiento() {
    if (!this.seguimientoForm.valid || !this.casoEncontrado) return;

    this.submitting = true;
    const formData = new FormData();
    this.files.forEach(f => formData.append('file', f));
    formData.append('estadoInvestigacion', this.seguimientoForm.value.nuevoEstado);

    this.seguimientoService.enviarSeguimientoMaltrato(this.casoEncontrado.numeroDeic, formData)
      .subscribe({
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
