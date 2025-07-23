import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login/login.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { UserListComponent } from './modules/user-list/user-list.component';
import { UserDetailComponent } from './modules/user-list/user-detail/user-detail.component'; // Asegúrate de crear este componente
import { CreateUserComponent } from './modules/user-list/create-user/create-user.component';
import { AuthGuard } from '../app/core/guards/auth.guard';
import { LoginGuard  } from '../app/core/guards/login.guard';
import { ActivateUserComponent } from './modules/activate-user/activate-user.component';
import { LdapUsersComponent } from './modules/ldap-users/ldap-users.component';
import { WelcomeComponent } from './modules/welcome/welcome.component';
import { PqrsListComponent } from './modules/pqrs/pqrs-list/pqrs-list.component';

import { PqrsDetailComponent } from './modules/pqrs/pqrs-detail/pqrs-detail.component';
import { UnassignedPqrsComponent } from './modules/pqrs/unassigned-pqrs/unassigned-pqrs.component';
import { MyPqrsComponent } from './modules/pqrs/my-pqrs/my-pqrs.component';
import { PqrsReportsComponent } from './modules/pqrs/pqrs-reports/pqrs-reports.component';
import { CreatePqrsInternalComponent } from './modules/pqrs/create-pqrs-internal/create-pqrs-internal.component';
import { CreatePqrsComponent } from './modules/pqrs/create-pqrs/create-pqrs.component';
import { AssignedPqrsComponent } from './modules/pqrs/assigned-pqrs/assigned-pqrs.component';
import { MyAssignedPqrsComponent } from './modules/pqrs/my-assigned-pqrs/my-assigned-pqrs.component';
import { ConsultaPqrsComponent } from './modules/pqrs/consulta-pqrs/consulta-pqrs.component';
import { RoleManagementComponent } from './modules/role-management/role-management.component';
import { ModuleManagementComponent } from './modules/module-management/module-management.component';
import { UserDashboardComponent } from './modules/dashboard/user-dashboard/user-dashboard.component';
import { ForgotPasswordComponent } from './modules/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './modules/auth/reset-password/reset-password.component';


export const routes: Routes = [
  {
    path: '',
    component: WelcomeComponent, // Aquí asignas el componente de bienvenida
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard]  // Agregamos el LoginGuard
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'user-dashboard',
    component: UserDashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'roles',
    component: RoleManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'modulos',
    component: ModuleManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'usuarios',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'ldap', // Poner la ruta de LDAP antes de las rutas con parámetros
        component: LdapUsersComponent
      },
      {
        path: '',
        component: UserListComponent
      },
      {
        path: 'registro',
        data: { isExternalUser: false },
        component: CreateUserComponent
      },
      {
        path: ':id', // Mover la ruta con parámetro al final
        component: UserDetailComponent
      }
    ]
  },
  {
    path: 'registro-externo',  // o 'registro-externo'
    component: CreateUserComponent,  // Accesible públicamente
    data: { isExternalUser: true }
  },
  {
    path: 'consulta-pqrs',
    children: [
      {
        path: '',
        component: ConsultaPqrsComponent
        // Sin AuthGuard - acceso público
      },
      {
        path: ':radicado/:token',
        component: ConsultaPqrsComponent
        // Sin AuthGuard - acceso público para enlaces de correo
      }
    ]
  },

  {
    path: 'pqrs',  
    children: [
      {
        path: '', 
        component: PqrsListComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'nuevo-pqrs',
        component: CreatePqrsComponent,
        //canActivate: [AuthGuard]
      },
      {
        path: 'nuevo',
        component: CreatePqrsInternalComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'sin-asignar',
        component: UnassignedPqrsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'asignados',
        component: AssignedPqrsComponent
      },
      {
        path: 'mis-asignaciones',  // Nueva ruta
        component: MyAssignedPqrsComponent,
        canActivate: [AuthGuard]
      },

      {
        path: 'mis-pqrs',
        component: MyPqrsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'consulta-pqrs',
        children: [
          {
            path: '',
            component: ConsultaPqrsComponent,
            canActivate: [AuthGuard]
          },
          {
            path: ':token',
            component: ConsultaPqrsComponent,
            canActivate: [AuthGuard]
          }
        ]
      },
      {
        path: 'reportes',
        component: PqrsReportsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: ':id',
        component: PqrsDetailComponent,
        canActivate: [AuthGuard]
      }
    ]
  },
  {
    path: 'activate-user',
    children: [
      {
        path: '',
        component: ActivateUserComponent
      },
      {
        path: ':token',
        component: ActivateUserComponent
      }
    ]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password/:token',
    component: ResetPasswordComponent
  },
  {
    path: '',
    redirectTo: '/index',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
