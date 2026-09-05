import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-seleccionar-tipo-caso',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './seleccionar-tipo-caso.component.html',
  styleUrl: './seleccionar-tipo-caso.component.css'
})
export class SeleccionarTipoCasoComponent {

  constructor(
    private router: Router
  ) {}

  seleccionar(tipo: 'alerta' | 'maltrato' | 'conflicto'): void {

    const rutas = {
      alerta: '/casos/add-case-alerta',
      maltrato: '/casos/add-case-maltrato',
      conflicto: '/casos/add-case-conflicto'
    };

    this.router.navigate([
      rutas[tipo]
    ]);
  }
}
