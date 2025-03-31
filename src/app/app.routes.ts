import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'casos',
    loadComponent: () => import('./casos/dashboard-case.component'),
    children: [
      {
        path: 'add-case-alerta',
        title: 'Alerta Alba-Keneth',
        loadComponent: () => import('./casos/pages/add-case-alerta/add-case-alerta.component')
      },
      {
        path: 'add-case-maltrato',
        title: 'Maltrato',
        loadComponent: () => import('./casos/pages/add-case-maltrato/add-case-maltrato.component')
      },
      {
        path: 'add-case-conflicto',
        title: 'Conflicto',
        loadComponent: () => import('./casos/pages/add-case-conflicto/add-case-conflicto.component')
      },
      {
        path: 'estadisticas',
        title: 'Estadisticas generales',
        loadComponent: () => import('./dashboard/estadistics/estadistics.component')
      },
      {
        path: 'Busquedas',
        title: 'Busquedas',
        loadComponent: () => import('./busquedas/search-profile/search-profile.component')
      },
      {
        path: 'profile',
        title: 'Perfil',
        loadComponent: () => import('./busquedas/profile/profile.component')
      },
      {
        path: '', redirectTo: 'add-case-alerta', pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard-principal.component'),
    children:[
      {
        path: '',
        redirectTo: 'estadisticas',
        pathMatch: 'full',
      },

    ]
  },

  {
    path: '',
    redirectTo: '/casos',
    pathMatch: 'full'
  }


];
