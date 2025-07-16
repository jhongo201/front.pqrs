import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap, switchMap, shareReplay } from 'rxjs/operators';
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

  /**
   * Obtiene el rol del usuario actual desde localStorage
   * @returns number | null
   */
  private getCurrentUserRole(): number | null {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return typeof user.rol === 'object' ? user.rol.id : null;
      }
    } catch (error) {
      console.error('Error obteniendo rol del usuario:', error);
    }
    return null;
  }

  loadRoutes(): Observable<Route[]> {
    return this.http.get<Route[]>(`${environment.apiUrl}/rutas`).pipe(
      tap(routes => {
        console.log('RouteService - Rutas cargadas:', routes.length);
        // Log específico de rutas PQRS
        const pqrsRoutes = routes.filter(r => r.ruta.includes('pqrs'));
        console.log('RouteService - Rutas PQRS encontradas:', pqrsRoutes.map(r => ({ id: r.idRuta, ruta: r.ruta })));
      }),
      map(routes => {
        this.routes = routes;
        console.log('RouteService - Rutas almacenadas:', this.routes.length);
        return this.routes;
      })
    );
  }

  // Variable para almacenar en caché las solicitudes en curso por ID de rol
  private permissionsRequests: { [key: number]: Observable<RolePermission[]> } = {};

  /**
   * Carga los permisos del usuario basados en su rol
   * @param roleId ID del rol del usuario (opcional, si no se proporciona se obtendrá dinámicamente)
   * @returns Observable con los permisos del rol
   */
  loadUserPermissions(roleId?: number): Observable<RolePermission[]> {
    // Si ya tenemos permisos cargados y se solicita el mismo rol, devolver los existentes
    if (this.userPermissions.length > 0 && roleId !== undefined) {
      const existingPermission = this.userPermissions.find(p => p.idRol === roleId);
      if (existingPermission) {
        console.log(`Usando permisos en caché para rol ${roleId}`);
        console.log('Permisos en caché:', this.userPermissions.map(p => ({ idRuta: p.idRuta, ruta: this.routes.find(r => r.idRuta === p.idRuta)?.ruta })));
        return of(this.userPermissions);
      }
    }

    // Si no se proporciona ID, obtenerlo del localStorage
    if (roleId === undefined) {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          roleId = typeof user.rol === 'object' ? user.rol.id : undefined;
          
          if (roleId === undefined) {
            console.warn('No se pudo obtener el ID del rol del usuario, usando valor por defecto');
            roleId = 1; // Valor por defecto
          } else {
            console.log(`ID de rol obtenido del localStorage: ${roleId}`);
          }
        } else {
          console.warn('No hay datos de usuario en localStorage, usando rol por defecto');
          roleId = 1; // Valor por defecto
        }
      } catch (error) {
        console.error('Error obteniendo el rol del usuario:', error);
        roleId = 1; // Valor por defecto en caso de error
      }
    }

    // Verificar si ya hay una solicitud en curso para este rol
    if (this.permissionsRequests[roleId]) {
      console.log(`Reutilizando solicitud en curso para rol ${roleId}`);
      return this.permissionsRequests[roleId];
    }

    // Crear una nueva solicitud y almacenarla
    console.log(`Cargando permisos para el rol con ID: ${roleId}`);
    
    const request = this.http.get<RolePermission[]>(`${environment.apiUrl}/permisorols/rol/${roleId}`).pipe(
      tap(permissions => console.log(`Permisos cargados para rol ${roleId}:`, permissions.length)),
      map(permissions => {
        this.userPermissions = permissions;
        // Eliminar la solicitud del caché una vez completada
        delete this.permissionsRequests[roleId];
        return permissions;
      }),
      catchError(error => {
        console.error(`Error cargando permisos para rol ${roleId}:`, error);
        // Eliminar la solicitud del caché en caso de error
        delete this.permissionsRequests[roleId];
        return of([]);
      }),
      // Compartir la misma respuesta entre múltiples suscriptores
      shareReplay(1)
    );

    // Almacenar la solicitud en el caché
    this.permissionsRequests[roleId] = request;
    return request;
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
    console.log(`RouteService - Verificando permiso para: ${path}, acción: ${action}`);
    console.log(`RouteService - Rutas disponibles: ${this.routes.length}`);
    console.log(`RouteService - Permisos de usuario: ${this.userPermissions.length}`);
    
    // Permitir acceso especial a /user-dashboard para usuarios con rol USUARIO (ID: 2)
    if (path === '/user-dashboard' && action === 'read') {
      const userRole = this.getCurrentUserRole();
      console.log(`RouteService - Verificación especial user-dashboard, rol: ${userRole}`);
      if (userRole === 2) { // Rol USUARIO
        console.log('RouteService - Acceso permitido a user-dashboard para rol USUARIO');
        return true;
      }
    }
    
    // Si es una ruta pública y la acción es lectura, permitir
    if (this.isPublicRoute(path) && action === 'read') {
      console.log(`RouteService - Ruta pública permitida: ${path}`);
      return true;
    }

    const route = this.findMatchingRoute(path);
    if (!route) {
      console.log(`RouteService - Ruta no encontrada: ${path}`);
      return false;
    }
    
    console.log(`RouteService - Ruta encontrada:`, route);

    const permission = this.userPermissions.find(p => p.idRuta === route.idRuta);
    if (!permission) {
      console.log(`RouteService - Permiso no encontrado para la ruta: ${route.idRuta}`);
      return false;
    }
    
    console.log(`RouteService - Permiso encontrado:`, permission);

    const hasPermission = action === 'read' ? permission.puedeLeer :
                         action === 'write' ? permission.puedeEscribir :
                         action === 'update' ? permission.puedeActualizar :
                         permission.puedeEliminar;

    console.log(`RouteService - Resultado verificación:`, { route, permission, action, hasPermission });
    return hasPermission;
  }

  private findMatchingRoute(path: string): Route | undefined {
    const normalizedPath = this.normalizeRoute(path);
  
  // Log específico para rutas problemáticas
  if (path.includes('user-dashboard') || path.includes('pqrs/nuevo') || path.includes('pqrs')) {
    console.log(`RouteService - Buscando ruta: ${path}`, {
      pathOriginal: path,
      pathNormalizado: normalizedPath,
      rutasDisponibles: this.routes.filter(r => r.ruta.includes('pqrs') || r.ruta.includes('dashboard')).map(r => ({ id: r.idRuta, ruta: r.ruta, modulo: r.nombreModulo }))
    });
  }
  
    // Obtener el segmento base y construir la ruta completa para PQRS
    const segments = normalizedPath.split('/').filter(Boolean);
    const baseSegment = '/' + segments[0];
    
    // Construir posibles rutas basadas en la estructura actual
    // IMPORTANTE: Priorizar rutas frontend exactas sobre rutas API
    const possiblePaths = [
      normalizedPath,                              // ruta original (prioridad 1)
      normalizedPath.replace('/api/', '/'),        // sin prefijo api (prioridad 2)
      `/api${normalizedPath}`,                     // con prefijo api (prioridad 3)
      `/api/pqrs/${segments.slice(1).join('/')}`,  // para subrutas de pqrs
      `/api${baseSegment}/${segments.slice(1).join('/')}` // para otras subrutas
    ].filter(Boolean); // eliminar posibles undefined

  /*  console.log('Buscando coincidencia para rutas:', {
      original: path,
      normalizada: normalizedPath,
      segmentos: segments,
      posiblesRutas: possiblePaths
    });*/

    // Buscar coincidencias con prioridad: exactas primero, luego aproximadas
    let route = null;
    
    // 1. Buscar coincidencia exacta primero
    route = this.routes.find(r => r.ruta === normalizedPath);
    
    if (route && (path.includes('pqrs') || path.includes('dashboard'))) {
      console.log('RouteService - Coincidencia EXACTA encontrada:', {
        rutaBD: route.ruta,
        rutaActual: path,
        tipoCoincidencia: 'exacta'
      });
    }
    
    // 2. Si no hay coincidencia exacta, buscar con possiblePaths
    if (!route) {
      route = this.routes.find(route => {
        const matches = possiblePaths.some(p => this.pathMatch(route.ruta, p));
        if (matches && (path.includes('pqrs') || path.includes('dashboard'))) {
          console.log('RouteService - Coincidencia APROXIMADA encontrada:', {
            rutaBD: route.ruta,
            rutaActual: path,
            tipoCoincidencia: 'aproximada'
          });
        }
        return matches;
      });
    }

    if (!route && (path.includes('pqrs') || path.includes('dashboard'))) {
      console.log('RouteService - No se encontró ruta coincidente:', {
        path,
        possiblePaths,
        rutasDisponibles: this.routes.filter(r => r.ruta.includes('pqrs')).map(r => r.ruta)
      });
    }

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