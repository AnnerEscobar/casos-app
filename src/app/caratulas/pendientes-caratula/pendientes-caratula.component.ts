import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

interface CaratulaPendiente {
  tipoCaso: 'Alerta' | 'Maltrato' | 'Conflicto';
  numeroDeic: string;
  numeroMp: string;
  numeroAlerta?: string;
  nombre: string;
  lugar: string;
  observaciones: string;
  investigador: string;
}

@Component({
  selector: 'app-pendientes-caratula',
  imports: [MatTableModule, MatCardModule, MatButtonModule],
  templateUrl: './pendientes-caratula.component.html',
  styleUrl: './pendientes-caratula.component.css'
})


export default class PendientesCaratulaComponent {

  constructor(private router: Router) { }

  pendientes: CaratulaPendiente[] = [
    {
      tipoCaso: 'Maltrato',
      numeroDeic: 'DEIC51-2025-02-25-955',
      numeroMp: 'M0030-2025-755',
      nombre: 'Ada Lidbeth Escobar Cruz',
      lugar: 'Aldea Sitio Viejo, Jutiapa',
      observaciones: 'Ninguna',
      investigador: 'Anner Escobar'
    },
    {
      tipoCaso: 'Alerta',
      numeroDeic: 'DEIC52-2025-04-03-343',
      numeroMp: 'M0030-2025-817',
      numeroAlerta: '1721-2025',
      nombre: 'Pablo Gabriel Barillas',
      lugar: 'Barrio San Antonio, zona 6',
      observaciones: 'Concluido',
      investigador: 'Anner Escobar'
    }
  ];


  usarCaratula(caratula: CaratulaPendiente) {
    if (caratula.tipoCaso === 'Alerta') {
      this.router.navigate(['/casos/add-case-alerta'], { state: caratula });
    } else if (caratula.tipoCaso === 'Maltrato') {
      this.router.navigate(['/casos/add-case-maltrato'], { state: caratula });
    } else if (caratula.tipoCaso === 'Conflicto') {
      this.router.navigate(['/casos/add-case-conflicto'], { state: caratula });
    }
  }



}
