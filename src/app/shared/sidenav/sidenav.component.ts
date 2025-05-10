import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { routes } from '../../app.routes';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import {MatExpansionModule} from '@angular/material/expansion';

@Component({
  selector: 'app-sidenav',
  imports: [
    MatListModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    CommonModule,
    MatExpansionModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {


/*   public menuItems = routes
    .map(route => route.children ?? [])
    .flat()
    .filter(route => route && route.path)
    .filter(route => !route.path?.includes(':'))
    .filter(route => route.path !== 'profile'); */

    public menuItems = [
      {
        title: 'Alerta Alba-Keneth',
        icon: 'warning',
        children: [
          { title: 'Agregar Alerta', path: 'add-case-alerta' },
          { title: 'Agregar Seguimiento', path: 'seguimiento-alerta' }
        ]
      },
      {
        title: 'Maltrato',
        icon: 'report',
        children: [
          { title: 'Agregar Maltrato', path: 'add-case-maltrato' },
          { title: 'Agregar Seguimiento', path: 'seguimiento-maltrato' }
        ]
      },
      {
        title: 'Conflicto',
        icon: 'gavel',
        children: [
          { title: 'Agregar Conflicto', path: 'add-case-conflicto' },
          { title: 'Agregar Seguimiento', path: 'seguimiento-conflicto' }
        ]
      },
      {
        title: 'Estadísticas',
        icon: 'bar_chart',
        children:[
          { title: 'Estadísticas', path: 'estadisticas' }
        ]
      },
      {
        title: 'Búsquedas',
        icon: 'search',
        children:[
          { title: 'Busquedas', path: 'Busquedas' }
        ]
      },
      {
        title: 'Generar Caratulas',
        icon: 'autorenew',
        children:[
          { title: 'Generar Caratula', path: 'caratulas' },
          { title: 'Pendienetes', path: 'pendientes', badge: 4 }
        ]
      }
    ];


}
