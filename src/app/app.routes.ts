import { Routes } from '@angular/router';
import { routes as publicMenuRoutes } from './public-menu/menu.routes';
import { adminRoutes } from './admin/admin.routes';

export const routes: Routes = [
  ...publicMenuRoutes,
  {
    path: 'admin',
    children: adminRoutes,
  },
  {
    path: '',
    loadComponent: () =>
      import('./public-menu/home/home').then((m) => m.Home),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
