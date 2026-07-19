import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login').then((m) => m.AdminLogin),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shell/shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./categories/categories').then((m) => m.AdminCategories),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/products').then((m) => m.AdminProducts),
      },
      {
        path: 'menu-pdf',
        loadComponent: () =>
          import('./menu-pdf/menu-pdf').then((m) => m.AdminMenuPdf),
      },
      {
        path: 'locations',
        loadComponent: () =>
          import('./locations/locations').then((m) => m.AdminLocations),
      },
      {
        path: 'reach-out',
        loadComponent: () =>
          import('./reach-out/reach-out').then((m) => m.AdminReachOut),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./messages/messages').then((m) => m.AdminMessages),
      },
    ],
  },
];
