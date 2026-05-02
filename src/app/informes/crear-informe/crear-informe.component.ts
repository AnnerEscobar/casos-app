import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InformeService } from '../services/informe.service';

@Component({
  selector: 'app-crear-informe',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatInputModule, MatSelectModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './crear-informe.component.html',
  styleUrl: './crear-informe.component.css'
})
export class CrearInformeComponent implements OnInit {

  // Estado general
  informe: any = null;
  cargando = false;
  guardando = false;
  error = '';

  // Paso inicial
  modoInicio = true;
  nuevoNumeroDeic = '';
  nuevoNumeroMp = '';
  nuevoTipo = '';

  // Sección activa
  seccionActiva = 'datosGenerales';

  secciones = [
    { key: 'datosGenerales', label: 'Datos generales', icon: 'description' },
    { key: 'perfilVictima', label: 'Perfil de la víctima', icon: 'person' },
    { key: 'perfilSecundario', label: 'Perfil del sindicado/denunciante', icon: 'person_outline' },
    { key: 'entrevistas', label: 'Entrevistas', icon: 'record_voice_over' },
    { key: 'perfilacionLugar', label: 'Perfilación del lugar', icon: 'location_on' },
    { key: 'diligencias', label: 'Diligencias', icon: 'assignment' },
    { key: 'conclusiones', label: 'Conclusiones', icon: 'gavel' },
  ];

  // Datos de cada sección (editables)
  datosGenerales: any = {};
  perfilVictima: any = {};
  perfilSecundario: any = {};
  entrevistas: any = {};
  perfilacionLugar: any = {};
  diligencias: any = {};
  conclusiones: any = {};

  constructor(
    private informeService: InformeService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const deic = this.route.snapshot.queryParamMap.get('deic');
    if (deic) {
      this.modoInicio = false;
      this.cargarInforme(deic);
    }
  }

  get labelSecundario(): string {
    if (!this.informe) return 'Perfil del sindicado/denunciante';
    if (this.informe.tipoInforme === 'alerta') return 'Perfil del denunciante';
    if (this.informe.tipoInforme === 'maltrato') return 'Perfil del sindicado';
    return 'Perfil del adolescente infractor';
  }

  get seccionesAdaptadas() {
    return this.secciones.map(s =>
      s.key === 'perfilSecundario' ? { ...s, label: this.labelSecundario } : s
    );
  }

  seccionCompletada(key: string): boolean {
    return this.informe?.seccionesCompletadas?.includes(key) ?? false;
  }

  crearNuevoInforme() {
    if (!this.nuevoNumeroDeic || !this.nuevoNumeroMp || !this.nuevoTipo) {
      this.snackBar.open('Completa todos los campos para crear el informe.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.cargando = true;
    this.informeService.crear({
      numeroDeic: this.nuevoNumeroDeic,
      numeroMp: this.nuevoNumeroMp,
      tipoInforme: this.nuevoTipo
    }).subscribe({
      next: (data) => {
        this.informe = data;
        this.cargarSecciones();
        this.modoInicio = false;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear el informe.';
        this.cargando = false;
      }
    });
  }

  cargarInforme(numeroDeic: string) {
    this.cargando = true;
    this.informeService.obtenerPorDeic(numeroDeic).subscribe({
      next: (data) => {
        this.informe = data;
        this.cargarSecciones();
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se encontró el informe.';
        this.cargando = false;
      }
    });
  }

  cargarSecciones() {
    this.datosGenerales = { ...this.informe.datosGenerales };
    this.perfilVictima = { ...this.informe.perfilVictima };
    this.perfilSecundario = { ...this.informe.perfilSecundario };
    this.entrevistas = { ...this.informe.entrevistas };
    this.perfilacionLugar = { ...this.informe.perfilacionLugar };
    this.diligencias = { ...this.informe.diligencias };
    this.conclusiones = { ...this.informe.conclusiones };
  }

  seleccionarSeccion(key: string) {
    this.seccionActiva = key;
  }

  guardarSeccion() {
    this.guardando = true;
    const payload: any = {
      [this.seccionActiva]: (this as any)[this.seccionActiva],
      seccionesCompletadas: [this.seccionActiva]
    };

    this.informeService.actualizarSeccion(this.informe.numeroDeic, payload).subscribe({
      next: (data) => {
        this.informe = data;
        this.guardando = false;
        this.snackBar.open('Sección guardada correctamente.', 'OK', { duration: 2000 });
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al guardar la sección.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  generarWord() {
    this.informeService.descargarWord(this.informe.numeroDeic);
  }

  enviarAPendientes() {
    this.informeService.marcarPendienteRegistro(this.informe.numeroDeic).subscribe({
      next: () => {
        this.snackBar.open('Informe enviado a pendientes de registro.', 'OK', { duration: 3000 });
        this.router.navigate(['/casos/pendientes-informe']);
      },
      error: () => {
        this.snackBar.open('Error al enviar a pendientes.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
