
import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

  // WEB PÚBLICA
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then(m => m.Home)
  },

  // LOGIN ADMINISTRADOR
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },

  // PANEL ADMINISTRADOR PROTEGIDO
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [

      // DASHBOARD
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      // LISTADO DE PROYECTOS
      {
        path: 'proyectos',
        loadComponent: () =>
          import('./features/admin/projects/project-list/project-list')
            .then(m => m.ProjectList)
      },

      // CREAR PROYECTO
      {
        path: 'proyectos/nuevo',
        loadComponent: () =>
          import('./features/admin/projects/project-form/project-form')
            .then(m => m.ProjectForm)
      },

      // EDITAR PROYECTO
      {
        path: 'proyectos/:id',
        loadComponent: () =>
          import('./features/admin/projects/project-form/project-form')
            .then(m => m.ProjectForm)
      }

    ]
  },

  // RUTA NO ENCONTRADA
  {
    path: '**',
    redirectTo: ''
  }

];
