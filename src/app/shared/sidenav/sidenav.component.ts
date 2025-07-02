import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { CaratulaService } from '../../caratulas/caratula.service';
import { MatMenuModule } from '@angular/material/menu';
import { SharedService } from '../shared.service';


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
    MatExpansionModule,
    MatMenuModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {

  user = {email: '', role: ''};
  loading = false;
  error = '';
  pendientesCount: number = 0;

  constructor(
    private caratulaService: CaratulaService,
    private router: Router,
    private shared: SharedService
  ) { }

  ngOnInit() {
    this.getContadorPendientes();
    this.loadUser();
  }

  getContadorPendientes() {

    this.caratulaService.getPendientesCount().subscribe({
      next: (res) => {
        this.pendientesCount = res.total;
        // Actualiza el badge dinámicamente
        this.menuItems = this.menuItems.map(item => {
          if (item.title === 'Generar Caratulas') {
            return {
              ...item,
              children: item.children.map(sub => {
                if (sub.title === 'Pendienetes') {
                  return { ...sub, badge: this.pendientesCount };
                }
                return sub;
              })
            };
          }
          return item;
        });
      },
      error: (err) => console.error('Error al obtener contador de carátulas pendientes', err)
    });
  }

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
      children: [
        { title: 'Estadísticas', path: 'estadisticas' }
      ]
    },
    {
      title: 'Búsquedas',
      icon: 'search',
      children: [
        { title: 'Busquedas', path: 'Busquedas' },
        { title: 'Busqueda Avanzada', path: 'busqueda-avanzada' }
      ]
    },
    {
      title: 'Generar Caratulas',
      icon: 'autorenew',
      children: [
        { title: 'Generar Caratula', path: 'caratulas' },
        { title: 'Pendienetes', path: 'pendientes', badge: this.pendientesCount },
      ]
    }
  ];

  closeSession(){
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }


    loadUser(): void {
    this.loading = true;
    this.error = '';
    this.shared.getUserData().subscribe({
      next: (data: any) => {
        this.user = {
          email: data.email,
          role: data.role
        };
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'No se pudo cargar la información del usuario';
        this.loading = false;
      }
    });
  }




}
