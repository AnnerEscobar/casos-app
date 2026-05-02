import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InformeService } from '../services/informe.service';

@Component({
  selector: 'app-pendientes-informe',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  templateUrl: './pendientes-informe.component.html',
  styleUrl: './pendientes-informe.component.css'
})
export class PendientesInformeComponent implements OnInit {

  pendientes: any[] = [];
  cargando = false;

  constructor(
    private informeService: InformeService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargarPendientes();
  }

  cargarPendientes() {
    this.cargando = true;
    this.informeService.obtenerPendientes().subscribe({
      next: (data) => {
        this.pendientes = data;
        this.cargando = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar los pendientes.', 'Cerrar', { duration: 3000 });
        this.cargando = false;
      }
    });
  }

  editarInforme(informe: any) {
    this.router.navigate(['/casos/crear-informe'], {
      queryParams: { deic: informe.numeroDeic }
    });
  }

  irARegistrarCaso(informe: any) {
    const ruta = informe.tipoInforme === 'alerta' ? '/casos/add-case-alerta'
      : informe.tipoInforme === 'maltrato' ? '/casos/add-case-maltrato'
      : '/casos/add-case-conflicto';
    this.router.navigate([ruta], { state: { informe } });
  }

  descargarWord(informe: any) {
    this.informeService.descargarWord(informe.numeroDeic);
  }

  tipoLabel(tipo: string): string {
    if (tipo === 'alerta') return 'Alerta Alba-Keneth';
    if (tipo === 'maltrato') return 'Maltrato';
    return 'Conflicto con la Ley';
  }

  progresoSecciones(informe: any): number {
    const completadas = informe.seccionesCompletadas?.length || 0;
    return Math.round((completadas / 7) * 100);
  }
}
