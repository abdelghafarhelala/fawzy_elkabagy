import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'menu',
    loadComponent: () =>
      import('./menu-pdf/menu-pdf').then((m) => m.MenuPdf),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
];
