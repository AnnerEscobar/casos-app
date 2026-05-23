/*import { Component, HostBinding, Input } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../auth/auth-service/auth.service';
import { AuthService } from '../../auth/auth-service/auth.service';


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
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {

  user = { email: '', role: '' };
  loading = false;
  error = '';
  pendientesCount: number = 0;
  @Input() collapsed = false;   // <<--- NUEVO

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

  closeSession() {
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
        this.error = 'No se pudo cargar la información del usuario';
        this.loading = false;
      }
    });
  }

}   */

  import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../auth/auth-service/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidenav',
  imports: [
    MatListModule, RouterModule, MatIconModule, MatButtonModule,
    MatSidenavModule, MatToolbarModule, CommonModule,
    MatExpansionModule, MatMenuModule, MatTooltipModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent implements OnDestroy {

  user = { email: '', role: '' };
  loading = false;
  error = '';
  pendientesCount: number = 0;

  @Input() collapsed = true;
  @Output() collapsedChange = new EventEmitter<boolean>();
  private pendientesSubscription?: Subscription;

  constructor(
    private caratulaService: CaratulaService,
    private router: Router,
    private shared: SharedService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.pendientesSubscription = this.caratulaService.pendientesCount$.subscribe((count) => {
      this.updatePendientesBadge(count);
    });
    this.caratulaService.refreshPendientesCount();
    this.loadUser();
  }

  ngOnDestroy() {
    this.pendientesSubscription?.unsubscribe();
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  getContadorPendientes() {
    this.caratulaService.getPendientesCount().subscribe({
      next: (res) => {
        this.updatePendientesBadge(res.total);
      },
      error: (err) => console.error('Error al obtener contador', err)
    });
  }

  private updatePendientesBadge(count: number) {
    this.pendientesCount = count;
    this.menuItems = this.menuItems.map(item => {
      if (item.title === 'Generar Caratulas') {
        return {
          ...item,
          children: item.children.map(sub =>
            sub.title === 'Pendienetes' ? { ...sub, badge: this.pendientesCount } : sub
          )
        };
      }
      return item;
    });
  }

  public menuItems = [
    {
      title: 'Alerta Alba-Keneth', icon: 'warning',
      children: [
        { title: 'Agregar Alerta', path: 'add-case-alerta' },
        { title: 'Agregar Seguimiento', path: 'seguimiento-alerta' }
      ]
    },
    {
      title: 'Maltrato', icon: 'report',
      children: [
        { title: 'Agregar Maltrato', path: 'add-case-maltrato' },
        { title: 'Agregar Seguimiento', path: 'seguimiento-maltrato' }
      ]
    },
    {
      title: 'Conflicto', icon: 'gavel',
      children: [
        { title: 'Agregar Conflicto', path: 'add-case-conflicto' },
        { title: 'Agregar Seguimiento', path: 'seguimiento-conflicto' }
      ]
    },
    {
      title: 'Estadísticas', icon: 'bar_chart',
      children: [{ title: 'Estadísticas', path: 'estadisticas' }]
    },
    {
      title: 'Búsquedas', icon: 'search',
      children: [
        { title: 'Busquedas', path: 'Busquedas' },
        { title: 'Busqueda Avanzada', path: 'busqueda-avanzada' }
      ]
    },
    {
      title: 'Generar Caratulas', icon: 'autorenew',
      children: [
        { title: 'Generar Caratula', path: 'caratulas' },
        { title: 'Pendienetes', path: 'pendientes', badge: this.pendientesCount },
      ]
    },
    {
  title: 'Informes',
  icon: 'article',
  children: [
    { title: 'Crear Informe', path: 'crear-informe' },
    { title: 'Pendientes de Registro', path: 'pendientes-informe' },
  ]
},
  ];

  closeSession() {
    this.authService.logout();
  }

  loadUser(): void {
    this.loading = true;
    this.shared.getUserData().subscribe({
      next: (data: any) => {
        this.user = { email: data.email, role: data.role };
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la información del usuario';
        this.loading = false;
      }
    });
  }
}
