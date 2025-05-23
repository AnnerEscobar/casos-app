import { authGuard } from './auth/auth-guards/auth.guard';
import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./auth/pages/login/auth.component')
  },
  {
    path: 'register',
    title: 'Registro',
    loadComponent: () => import('./auth/pages/register/register.component')
  },

  {
    path: 'casos',
    canActivate: [authGuard],
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
        path: 'seguimiento-alerta',
        title: 'Seguimiento Alerta',
        loadComponent: () => import('./seguimientos/seguimiento-alerta/seguimiento-alerta.component')
      },
      {
        path: 'seguimiento-maltrato',
        title: 'Seguimiento Maltrato',
        loadComponent: () => import('./seguimientos/seguimiento-maltrato/seguimiento-maltrato.component')
      },
      {
        path: 'seguimiento-conflicto',
        title: 'Seguimiento Conflicto',
        loadComponent: () => import('./seguimientos/seguimiento-conflicto/seguimiento-conflicto.component')
      },
      {
        path: 'estadisticas',
        title: 'Estadisticas',
        loadComponent: () => import('./dashboard/estadistics/estadistics.component')
      },
      {
        path: 'Busquedas',
        title: 'Busquedas',
        loadComponent: () => import('./busquedas/search-profile/search-profile.component')
      },
      {
        path: 'caratulas',
        title: 'Generar Caratula',
        loadComponent: () => import('./caratulas/generar-caratula/generar-caratula.component')
      },
      {
        path: 'pendientes',
        title: 'Pendientes',
        loadComponent: () => import('./caratulas/pendientes-caratula/pendientes-caratula.component')
      },
      {
        path: 'profile',
        title: 'Perfil',
        loadComponent: () => import('./busquedas/profile/profile.component')
      },
      {
        path: '', redirectTo: 'estadisticas', pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard-principal.component'),
    children: [
      {
        path: '',
        redirectTo: 'estadisticas',
        pathMatch: 'full',
      },

    ]
  },
  {
    path: 'settings',
    loadComponent: () => import('./shared/settings/settings.component'),
  },
  {
    path: 'change-password',
    loadComponent: () => import('./shared/change-password/change-password.component')
  },

  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }


];
