import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface PermisoRol {
  id?: number;
  idPermiso?: number;
  idRol: number;
  idRuta: number;
  nombreRuta?: string;
  descripcionRuta?: string;
  puedeLeer: boolean;
  puedeEscribir: boolean;
  puedeActualizar: boolean;
  puedeEliminar: boolean;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  private getRequestHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Obtener todos los roles
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(roles => console.log('Roles obtenidos:', roles.length)),
      catchError(error => {
        console.error('Error al obtener roles:', error);
        return of([]);
      })
    );
  }

  // Obtener un rol por ID
  getRoleById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/roles/${id}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(role => console.log('Rol obtenido:', role)),
      catchError(error => {
        console.error(`Error al obtener rol con ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Crear un nuevo rol
  createRole(role: Role): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles`, role, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(newRole => console.log('Rol creado:', newRole)),
      catchError(error => {
        console.error('Error al crear rol:', error);
        throw error;
      })
    );
  }

  // Actualizar un rol existente
  updateRole(id: number, role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/roles/${id}`, role, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(updatedRole => console.log('Rol actualizado:', updatedRole)),
      catchError(error => {
        console.error(`Error al actualizar rol con ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Eliminar un rol
  deleteRole(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/roles/${id}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(() => console.log(`Rol con ID ${id} eliminado`)),
      catchError(error => {
        console.error(`Error al eliminar rol con ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Obtener permisos de un rol
  getRolePermissions(roleId: number): Observable<PermisoRol[]> {
    console.log(`Obteniendo permisos para el rol con ID ${roleId}`);
    return this.http.get<PermisoRol[]>(`${this.apiUrl}/permisos-rol/rol/${roleId}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(permissions => {
        console.log(`Permisos obtenidos para rol ${roleId}:`, permissions);
        console.log(`Total de permisos obtenidos: ${permissions.length}`);
        // Verificar que los permisos tengan el formato correcto
        if (permissions.length > 0) {
          console.log('Ejemplo de permiso:', JSON.stringify(permissions[0]));
        }
      }),
      catchError(error => {
        console.error(`Error al obtener permisos para rol ${roleId}:`, error);
        return of([]);
      })
    );
  }

  // Actualizar permisos de un rol
  updateRolePermissions(roleId: number, permissions: PermisoRol[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/permisos-rol/actualizar-batch`, {
      idRol: roleId,
      permisos: permissions
    }, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(() => console.log(`Permisos actualizados para rol ${roleId}`)),
      catchError(error => {
        console.error(`Error al actualizar permisos para rol ${roleId}:`, error);
        throw error;
      })
    );
  }

  // Obtener todas las rutas disponibles
  getRoutes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rutas`, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(routes => console.log('Rutas obtenidas:', routes.length)),
      catchError(error => {
        console.error('Error al obtener rutas:', error);
        return of([]);
      })
    );
  }
}
