import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SeguimientoConflictoService } from '../seguimiento-services/seguimiento-conflicto.service';

@Component({
  selector: 'app-seguimiento-conflicto',
  imports: [MatCardModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, CommonModule, MatButtonModule],
  templateUrl: './seguimiento-conflicto.component.html',
  styleUrl: './seguimiento-conflicto.component.css'
})
export default class SeguimientoConflictoComponent {


    seguimientoForm!: FormGroup;
    casoEncontrado: any = null;
    files: File[] = [];

    constructor(
      private fb: FormBuilder,
      private seguimientoService: SeguimientoConflictoService,
      private snackBar: MatSnackBar) { }

    ngOnInit() {
      this.seguimientoForm = this.fb.group({
        numeroDeic: ['', Validators.required],
        nuevoEstado: ['Informado', Validators.required]
      });
    }


    onFileChange(event: any) {
      this.files = Array.from(event.target.files);
    }

    buscarCaso() {
      const numeroDeic = this.seguimientoForm.value.numeroDeic;
      this.seguimientoService.buscarCasoConflictoPorDeic(numeroDeic).subscribe(data => {
        this.casoEncontrado = data;
      });
    }

    enviarSeguimiento() {
      if (this.seguimientoForm.valid && this.casoEncontrado) {
        const formData = new FormData();
        this.files.forEach(file => formData.append('file', file));
        formData.append('estadoInvestigacion', this.seguimientoForm.value.nuevoEstado);

        this.seguimientoService.enviarSeguimientoConflicto(this.casoEncontrado.numeroDeic, formData)
          .subscribe(() => {
            // feedback de éxito
          });
      }
      this.seguimientoForm.reset();         // limpia el formulario
      this.files = [];                      // limpia el array de archivos
      this.casoEncontrado = null;           // oculta la sección del caso
      this.snackBar.open('Caso registrado correctamente', 'cerrado', { duration: 3000 });

    }



}
