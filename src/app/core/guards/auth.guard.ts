import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { RouteService } from '../services/route.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private routeService: RouteService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const fullPath = this.getFullPath(route);
    const token = route.params['token'];

    console.log('AuthGuard - Verificando ruta:', fullPath);

    // Si es la ruta de login y el usuario está autenticado, redirigir al dashboard
    if (fullPath === '/login' && this.authService.isLoggedIn()) {
      console.log('Usuario ya autenticado, redirigiendo a dashboard');
      this.router.navigate(['/dashboard']);
      return of(false);
    }

    // Si es una ruta pública, permitir acceso
    if (this.routeService.isPublicRoute(fullPath)) {
      console.log('Ruta pública - acceso permitido:', fullPath);
      return of(true);
    }

    // Si el usuario no está autenticado, redirigir al login
    //si tiene token de consulta de pqrs lo redirige a consultar pqrs
    if (!this.authService.isLoggedIn()) {
      if (token) {
        localStorage.setItem('returnUrl', `/pqrs/consulta-pqrs/${token}`);
      }
      console.log('Usuario no autenticado - redirigiendo a login');
      this.router.navigate(['/login']);
      return of(false);
    }

    // Verificamos la URL de retorno almacenada después de iniciar sesión
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      localStorage.removeItem('returnUrl');
      this.router.navigateByUrl(returnUrl);
      return of(false);
    }

    const userRole = this.authService.getUserRole();
    console.log('Rol del usuario:', userRole);

    if (!userRole) {
      console.log('Rol no encontrado - redirigiendo a login');
      this.router.navigate(['/login']);
      return of(false);
    }

    // Verificar permisos solo si la ruta no es pública y el usuario está autenticado
    return this.routeService.loadUserPermissions(userRole).pipe(
      map(() => {
        const hasPermission = this.routeService.hasPermission(fullPath, 'read');
        console.log('Verificación de permiso:', { fullPath, hasPermission });
        
        if (!hasPermission) {
          console.log('Sin permiso - redirigiendo a dashboard');
          this.router.navigate(['/dashboard']);
        }
        
        return hasPermission;
      }),
      catchError(error => {
        console.error('Error verificando permisos:', error);
        this.router.navigate(['/error']);
        return of(false);
      })
    );
  }

  private getFullPath(route: ActivatedRouteSnapshot): string {
    if (!route) {
      return '';
    }

    let path = '';
    
    if (route.routeConfig && route.routeConfig.path !== undefined) {
      path = route.routeConfig.path;
    }

    if (route.url.length > 0) {
      path = route.url.map(segment => segment.path).join('/');
    }

    if (path === '') {
      return '/';
    }

    return '/' + path.split('/').filter(Boolean).join('/');
  }
}