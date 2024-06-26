import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./routes/home.page'),
  },
  {
    path: 'bookings/:slug',
    loadComponent: () => import('./routes/bookings/bookings.page'),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./routes/auth/login.page'),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./routes/auth/register.page'),
  },
];
