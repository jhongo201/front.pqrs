import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RutaMenu {
  id: number;
  ruta: string;
  descripcion: string;
  puedeLeer: boolean;
  puedeEscribir: boolean;
  puedeActualizar: boolean;
  puedeEliminar: boolean;
}

export interface ModuloMenu {
  id: number;
  nombre: string;
  descripcion: string;
  rutas: RutaMenu[];
}

export interface MenuResponse {
  modulos: ModuloMenu[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = `${environment.apiUrl}/menu/opciones`;
  private menuSubject = new BehaviorSubject<ModuloMenu[]>([]);
  public menu$ = this.menuSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Carga las opciones de menú del usuario autenticado desde el backend
   */
  loadMenuOptions(): Observable<MenuResponse> {
    return this.http.get<MenuResponse>(this.apiUrl).pipe(
      tap(response => {
        this.menuSubject.next(response.modulos);
      })
    );
  }

  /**
   * Verifica si el usuario tiene permiso para acceder a una ruta específica
   * @param ruta La ruta a verificar
   * @returns true si el usuario tiene permiso de lectura para la ruta, false en caso contrario
   */
  hasPermissionToRoute(ruta: string): boolean {
    const modulos = this.menuSubject.value;
    
    // Buscar en todos los módulos
    for (const modulo of modulos) {
      // Buscar en todas las rutas del módulo
      const rutaEncontrada = modulo.rutas.find(r => 
        // Normalizar la ruta para comparación (eliminar el prefijo /api si existe)
        this.normalizeRoute(r.ruta) === this.normalizeRoute(ruta)
      );
      
      if (rutaEncontrada && rutaEncontrada.puedeLeer) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Normaliza una ruta para comparación
   * @param ruta La ruta a normalizar
   * @returns La ruta normalizada
   */
  private normalizeRoute(ruta: string): string {
    // Eliminar el prefijo /api si existe
    let normalizedRoute = ruta.startsWith('/api') ? ruta.substring(4) : ruta;
    
    // Asegurarse de que comienza con /
    if (!normalizedRoute.startsWith('/')) {
      normalizedRoute = '/' + normalizedRoute;
    }
    
    return normalizedRoute;
  }
}