import { Routes } from '@angular/router';
import { routes as publicMenuRoutes } from './public-menu/menu.routes';

export const routes: Routes = [
  ...publicMenuRoutes,
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
