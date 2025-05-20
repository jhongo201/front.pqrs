import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface Route {
  idRuta: number;
  idModulo: number;
  nombreModulo: string;
  ruta: string;
  descripcion: string;
  estado: boolean;
  esPublica: boolean;
  fechaCreacion: string;
}

interface RolePermission {
  idPermiso: number;
  idRol: number;
  idRuta: number;
  puedeLeer: boolean;
  puedeEscribir: boolean;
  puedeActualizar: boolean;
  puedeEliminar: boolean;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private routes: Route[] = [];
  private userPermissions: RolePermission[] = [];

  // Rutas que siempre son públicas
  private readonly ALWAYS_PUBLIC_ROUTES = [
    '/login',
    '/registro-externo',
    '/activate-user',
    '/',
    '/welcome',
    '/pqrs/nuevo-pqrs', 
    '/files',
    '/api/usuarios/registro',     // Endpoint de registro
    '/usuarios/registro',         // Ruta frontend de registro
    '/api/usuarios/registro-externo', // Por si tienes un endpoint específico para registro externo
  ];

  constructor(private http: HttpClient) {}

  loadRoutes(): Observable<Route[]> {
    return this.http.get<Route[]>(`${environment.apiUrl}/rutas`).pipe(
    //  tap(routes => console.log('Rutas sin procesar:', routes)),
      map(routes => {
        this.routes = routes;
        return this.routes;
      })
    );
  }

  loadUserPermissions(roleId: number): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${environment.apiUrl}/permisos-rol/rol/${roleId}`).pipe(
    //  tap(permissions => console.log('Permisos cargados:', permissions)),
      map(permissions => {
        this.userPermissions = permissions;
        return permissions;
      }),
      catchError(error => {
      //  console.error('Error cargando permisos:', error);
        return of([]);
      })
    );
  }

  isPublicRoute(path: string): boolean {
    // Si es una ruta siempre pública, retornar true inmediatamente
    if (this.ALWAYS_PUBLIC_ROUTES.includes(path)) {
     // console.log('Ruta siempre pública:', path);
      return true;
    }

    // Si no hay rutas cargadas, considerar privada
    if (!this.routes || this.routes.length === 0) {
      return false;
    }

    const route = this.findMatchingRoute(path);
    const isPublic = route?.esPublica ?? false;
  //  console.log('Verificación de ruta pública:', { path, route, isPublic });
    return isPublic;
  }

  hasPermission(path: string, action: 'read' | 'write' | 'update' | 'delete'): boolean {
    // Si es una ruta pública y la acción es lectura, permitir
    if (this.isPublicRoute(path) && action === 'read') {
      return true;
    }

    const route = this.findMatchingRoute(path);
    if (!route) {
    //  console.log('Ruta no encontrada:', path);
      return false;
    }

    const permission = this.userPermissions.find(p => p.idRuta === route.idRuta);
    if (!permission) {
    //  console.log('Permiso no encontrado para la ruta:', route.idRuta);
      return false;
    }

    const hasPermission = action === 'read' ? permission.puedeLeer :
                         action === 'write' ? permission.puedeEscribir :
                         action === 'update' ? permission.puedeActualizar :
                         permission.puedeEliminar;

  //  console.log('Verificación de permiso:', { route, permission, action, hasPermission });
    return hasPermission;
  }

  private findMatchingRoute(path: string): Route | undefined {
    const normalizedPath = this.normalizeRoute(path);
    
    // Obtener el segmento base y construir la ruta completa para PQRS
    const segments = normalizedPath.split('/').filter(Boolean);
    const baseSegment = '/' + segments[0];
    
    // Construir posibles rutas basadas en la estructura actual
    const possiblePaths = [
      normalizedPath,                              // ruta original
      `/api${normalizedPath}`,                     // con prefijo api
      normalizedPath.replace('/api/', '/'),        // sin prefijo api
      `/api/pqrs/${segments.slice(1).join('/')}`,  // para subrutas de pqrs
      `/api${baseSegment}/${segments.slice(1).join('/')}` // para otras subrutas
    ].filter(Boolean); // eliminar posibles undefined

  /*  console.log('Buscando coincidencia para rutas:', {
      original: path,
      normalizada: normalizedPath,
      segmentos: segments,
      posiblesRutas: possiblePaths
    });*/

    const route = this.routes.find(route => {
      const matches = possiblePaths.some(p => this.pathMatch(route.ruta, p));
      if (matches) {
      /*  console.log('Ruta coincidente encontrada:', {
          rutaBD: route.ruta,
          rutaActual: path,
          coincidencia: true
        });*/
      }
      return matches;
    });

  /*  if (!route) {
      console.log('No se encontró ruta coincidente para ninguna de las posibles rutas');
    }*/

    return route;
  }

  private normalizeRoute(path: string): string {
    if (!path) return '/';
    let cleanPath = path.split(/[?#]/)[0];
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath;
  }

  private pathMatch(routePath: string, currentPath: string): boolean {
    const normalized1 = this.normalizeRoute(routePath);
    const normalized2 = this.normalizeRoute(currentPath);

   /* console.log('Comparando rutas:', {
      rutaPatron: normalized1,
      rutaActual: normalized2
    });*/

    // Coincidencia exacta
    if (normalized1 === normalized2) {
      return true;
    }

    // Si la ruta tiene comodín
    if (normalized1.includes('**')) {
      const base = normalized1.replace('/**', '');
      const matches = normalized2.startsWith(base);
     /* console.log('Coincidencia con comodín:', {
        base,
        matches
      });*/
      return matches;
    }

    // Si es una ruta con parámetros {id}
    if (normalized1.includes('{') && normalized1.includes('}')) {
      const regexPattern = normalized1.replace(/\{[^}]+\}/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      const matches = regex.test(normalized2);
     /* console.log('Coincidencia con parámetros:', {
        patron: regexPattern,
        matches
      });*/
      return matches;
    }

    return false;
  }
}