import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { MenuComponent } from './modules/menu/menu.component';
import { CommonModule } from '@angular/common';
import { RouteService } from './core/services/route.service';
import { HeaderDashboardComponent } from "./shared/header-dashboard/header-dashboard.component";

interface UserData {
  username: string;
  nombreCompleto: string;
  rol: string | { id: number; nombre: string };
  empresa?: {
    id: number;
    nombre: string;
  };
  area?: {
    id: number;
    nombre: string;
  };
  direccion?: {
    id: number;
    nombre: string;
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent, CommonModule, HeaderDashboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  userData: UserData | null = null;
  showProfile = false;

  constructor(
    private authService: AuthService,
    private routeService: RouteService,
    private router: Router
  ) {
    this.authService.userData$.subscribe(
      userData => this.userData = userData
    );
  }

  ngOnInit() {
    this.loadRouteConfiguration();
  }

  private loadRouteConfiguration() {
    this.routeService.loadRoutes().subscribe({
      next: () => {
        if (this.authService.isLoggedIn()) {
          const userRole = this.authService.getUserRole();
          if (userRole !== undefined) {
            this.routeService.loadUserPermissions(userRole).subscribe();
          }
        }
      },
      error: (error) => console.error('Error cargando configuración de rutas:', error)
    });
  }

  shouldShowDashboard(): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    if (!isLoggedIn) {
      return false;
    }

    const currentPath = this.router.url.split('?')[0];
    // Obtener la ruta base (primer segmento)
    const baseSegment = '/' + currentPath.split('/')[1];
    
    // Rutas protegidas que siempre deben mostrar el dashboard completo
    const protectedRoutes = [
      '/modulos',
      '/roles',
      '/dashboard',
      '/usuarios'
    ];
    
    // Si la ruta actual está en la lista de rutas protegidas, mostrar el dashboard
    if (protectedRoutes.includes(baseSegment)) {
      return true;
    }
    
    // Verificar si alguna de las rutas (completa o base) es pública
    const isPublicFull = this.routeService.isPublicRoute(currentPath);
    const isPublicBase = this.routeService.isPublicRoute(baseSegment);
    const isPublic = isPublicFull || isPublicBase;

    console.log('Estado del dashboard:', {
      isLoggedIn,
      currentPath,
      baseSegment,
      isPublicFull,
      isPublicBase,
      shouldShow: isLoggedIn && !isPublic
    });

    return isLoggedIn && !isPublic;
  }

  toggleProfile() {
    this.showProfile = !this.showProfile;
  }

  getRoleName(): string {
    if (!this.userData?.rol) return 'No disponible';
    return typeof this.userData.rol === 'string' 
      ? this.userData.rol 
      : this.userData.rol.nombre;
  }

  logout() {
    this.authService.logout();
  }
}