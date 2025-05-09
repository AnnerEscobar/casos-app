import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeguimientoAlertaService } from '../seguimiento-services/seguimiento-alerta.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-seguimiento-alerta',
  imports: [MatCardModule, MatFormFieldModule, ReactiveFormsModule, MatSelectModule, CommonModule, MatInputModule, MatButtonModule],
  templateUrl: './seguimiento-alerta.component.html',
  styleUrl: './seguimiento-alerta.component.css'
})
export default class SeguimientoAlertaComponent {
  seguimientoForm!: FormGroup;
  casoEncontrado = false;
  estadoActual: string = '';
  files: File[] = [];

  constructor(private fb: FormBuilder, private sgicService: SeguimientoAlertaService, private router: Router) { }

  ngOnInit(): void {
    this.seguimientoForm = this.fb.group({
      numeroDeic: ['', Validators.required],
      nuevoEstado: ['', Validators.required],
      acompanante: [''],
      telefono: [''],
      direccion: [''],
    });
  }

  buscarCaso() {
    const deic = this.seguimientoForm.value.numeroDeic.trim();
    this.sgicService.getCasoPorDeic(deic).subscribe({
      next: (caso) => {
        this.estadoActual = caso.estadoInvestigacion;
        this.casoEncontrado = true;
      },
      error: (err) => {
        console.error('Error al buscar el caso:', err);
        alert('No se encontró un caso con ese número DEIC.');
      }
    });
  }


  onFileChange(event: any) {
    this.files = Array.from(event.target.files);
  }

  enviarSeguimiento() {
    if (this.seguimientoForm.invalid || this.files.length === 0) return;

    const numeroDeic = this.seguimientoForm.value.numeroDeic?.trim();

    const formData = new FormData();
    formData.append('nuevoEstado', this.seguimientoForm.value.nuevoEstado);

    if (this.seguimientoForm.value.nuevoEstado === 'Remitido') {
      formData.append('nombreAcompanante', this.seguimientoForm.value.acompanante || '');
      formData.append('telefono', this.seguimientoForm.value.telefono || '');
      formData.append('direccionLocalizacion', this.seguimientoForm.value.direccion || '');
    }

    this.files.forEach(file => formData.append('files', file));

    this.sgicService.enviarSeguimientoAlerta(numeroDeic, formData).subscribe({
      next: () => {
        alert('Seguimiento enviado con éxito');
        this.seguimientoForm.reset();
        this.files = [];
        this.casoEncontrado = false;
      },
      error: (err) => {
        console.error('Error al enviar seguimiento:', err);
      }
    });
  }


}
