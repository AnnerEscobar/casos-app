import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-seleccionar-tipo-seguimiento',
  standalone: true,
  imports: [
    MatIconModule
  ],
  templateUrl: './seleccionar-tipo-seguimiento.component.html',
  styleUrl: './seleccionar-tipo-seguimiento.component.css'
})
export class SeleccionarTipoSeguimientoComponent {

  constructor(
    private router: Router
  ) {}

  seleccionar(
    tipo: 'alerta' | 'maltrato' | 'conflicto'
  ): void {

    const rutas = {
      alerta: '/casos/seguimiento-alerta',
      maltrato: '/casos/seguimiento-maltrato',
      conflicto: '/casos/seguimiento-conflicto'
    };

    this.router.navigate([
      rutas[tipo]
    ]);
  }
}
