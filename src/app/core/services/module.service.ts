import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap, catchError, switchMap } from 'rxjs/operators';

// Interfaz para Módulo
export interface Module {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // Obtener headers para las peticiones
  private getRequestHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Obtener todos los módulos
  getModules(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.apiUrl}/modulos`, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(modules => console.log('Módulos obtenidos:', modules.length)),
      catchError(error => {
        console.error('Error al obtener módulos:', error);
        return throwError(() => new Error('Error al cargar los módulos. Por favor, intente nuevamente.'));
      })
    );
  }

  // Obtener un módulo por ID
  getModuleById(id: number): Observable<Module> {
    if (!id || isNaN(id) || id <= 0) {
      return throwError(() => new Error(`ID de módulo inválido: ${id}`));
    }

    return this.http.get<Module>(`${this.apiUrl}/modulos/${id}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(module => console.log(`Módulo obtenido con ID ${id}:`, module)),
      catchError(error => {
        console.error(`Error al obtener módulo con ID ${id}:`, error);
        return throwError(() => new Error('Error al cargar el módulo. Por favor, intente nuevamente.'));
      })
    );
  }

  // Crear un nuevo módulo
  createModule(module: Partial<Module>): Observable<Module> {
    if (!module.nombre || module.nombre.trim() === '') {
      return throwError(() => new Error('El nombre del módulo es obligatorio'));
    }

    return this.http.post<Module>(`${this.apiUrl}/modulos`, module, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(newModule => console.log('Módulo creado:', newModule)),
      catchError(error => {
        console.error('Error al crear módulo:', error);
        return throwError(() => new Error('Error al crear el módulo. Por favor, intente nuevamente.'));
      })
    );
  }

  // Actualizar un módulo existente
  updateModule(id: number, module: Partial<Module>): Observable<Module> {
    if (!id || isNaN(id) || id <= 0) {
      return throwError(() => new Error(`ID de módulo inválido: ${id}`));
    }

    if (!module.nombre || module.nombre.trim() === '') {
      return throwError(() => new Error('El nombre del módulo es obligatorio'));
    }

    return this.http.put<Module>(`${this.apiUrl}/modulos/${id}`, module, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(updatedModule => console.log(`Módulo actualizado con ID ${id}:`, updatedModule)),
      catchError(error => {
        console.error(`Error al actualizar módulo con ID ${id}:`, error);
        return throwError(() => new Error('Error al actualizar el módulo. Por favor, intente nuevamente.'));
      })
    );
  }

  // Eliminar un módulo
  deleteModule(id: number): Observable<any> {
    // Validar que el ID sea válido
    if (!id || isNaN(id) || id <= 0) {
      console.error('Error: ID de módulo inválido para eliminación:', id);
      return throwError(() => new Error(`ID de módulo inválido: ${id}`));
    }
    
    console.log(`Servicio - Eliminando módulo con ID: ${id}`);
    
    return this.http.delete(`${this.apiUrl}/modulos/${id}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      tap(() => console.log(`Módulo con ID ${id} eliminado exitosamente`)),
      catchError(error => {
        console.error(`Error al eliminar módulo con ID ${id}:`, error);
        if (error.status === 404) {
          return throwError(() => new Error(`El módulo con ID ${id} no existe`));
        }
        return throwError(() => new Error(`Error al eliminar módulo: ${error.message || 'Error desconocido'}`));
      })
    );
  }

  // Cambiar el estado de un módulo (activar/desactivar)
  toggleModuleStatus(id: number, currentStatus: boolean): Observable<Module> {
    if (!id || isNaN(id) || id <= 0) {
      return throwError(() => new Error(`ID de módulo inválido: ${id}`));
    }

    const newStatus = !currentStatus;
    const statusText = newStatus ? 'activado' : 'desactivado';
    console.log(`Cambiando estado del módulo con ID ${id} a ${statusText}`);

    // Primero obtenemos el módulo actual para no perder información
    return this.getModuleById(id).pipe(
      tap(module => console.log('Módulo obtenido para actualizar estado:', module)),
      switchMap(module => {
        // Actualizamos solo el estado
        const updatedModule = {
          ...module,
          estado: newStatus
        };
        
        return this.http.put<Module>(`${this.apiUrl}/modulos/${id}`, updatedModule, {
          headers: this.getRequestHeaders()
        }).pipe(
          tap(() => console.log(`Módulo ${statusText} correctamente`)),
          catchError(error => {
            console.error(`Error al ${newStatus ? 'activar' : 'desactivar'} módulo:`, error);
            return throwError(() => new Error(`Error al ${newStatus ? 'activar' : 'desactivar'} el módulo. Por favor, intente nuevamente.`));
          })
        );
      }),
      catchError(error => {
        console.error(`Error al obtener módulo para cambiar estado:`, error);
        return throwError(() => new Error('Error al cambiar el estado del módulo. Por favor, intente nuevamente.'));
      })
    );
  }
}
