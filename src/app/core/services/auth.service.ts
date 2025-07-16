import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = signal<boolean>(false);
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  public userData$ = this.userDataSubject.asObservable();

  // Mapeo de roles string a ID
  private readonly ROLE_MAP: { [key: string]: number } = {
    'ADMIN': 1,
    'USUARIO': 2
    // Agrega más roles según necesites
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        this.isAuthenticated.set(true);
        this.userDataSubject.next(parsedUserData);
        console.log('Auth inicializada:', { token: !!token, userData: parsedUserData });
      } catch (error) {
        console.error('Error parseando userData:', error);
        this.logout();
      }
    }
  }

  /**
   * Valida si un token JWT tiene el formato correcto
   * @param token El token JWT a validar
   * @returns true si el token tiene un formato válido, false en caso contrario
   */
  private isValidJwtFormat(token: string): boolean {
    // Un token JWT válido debe tener exactamente 2 puntos (3 partes)
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Almacena un token JWT de forma segura
   * @param token El token JWT a almacenar
   * @returns true si el token se almacenó correctamente, false en caso contrario
   */
  private storeToken(token: string): boolean {
    // Validar el formato del token
    if (!this.isValidJwtFormat(token)) {
      console.error('Intento de almacenar un token JWT inválido:', {
        token: token.length > 20 ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : token,
        puntos: token.split('.').length - 1
      });
      return false;
    }

    // Almacenar el token limpio
    localStorage.setItem('token', token.trim());
    return true;
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('Respuesta de login:', response);
          if (response && response.token) {
            // Validar y almacenar el token
            const tokenStored = this.storeToken(response.token);
            
            if (!tokenStored) {
              console.error('No se pudo almacenar el token JWT. Formato inválido.');
              return;
            }
            
            // Transformar la respuesta para incluir el ID del rol
            let rolId: number;
            
            // Si el backend ya envía el ID del rol, usarlo directamente
            if (response.rolId) {
              rolId = response.rolId;
              console.log('ID de rol obtenido directamente del backend:', rolId);
            } else {
              // Si no, usar el mapeo
              rolId = this.ROLE_MAP[response.rol] || 1;
              console.log('ID de rol obtenido mediante mapeo:', { rol: response.rol, id: rolId });
            }
            
            const transformedResponse = {
              ...response,
              rol: {
                id: rolId,
                nombre: response.rol
              }
            };

            localStorage.setItem('user', JSON.stringify(transformedResponse));
            this.isAuthenticated.set(true);
            this.userDataSubject.next(transformedResponse);
            
            console.log('Datos de usuario transformados:', transformedResponse);
            console.log('Rol del usuario para redirección:', transformedResponse.rol.nombre);
          
          // Redirigir según el rol del usuario
          if (transformedResponse.rol.nombre === 'USUARIO') {
            console.log('AuthService - Redirigiendo usuario a user-dashboard');
            this.router.navigate(['/user-dashboard']);
          } else {
            console.log('AuthService - Redirigiendo a dashboard principal');
            this.router.navigate(['/dashboard']);
          }
          } else {
            console.error('Respuesta de login inválida:', response);
          }
        }),
        catchError(error => {
          console.error('Error en login:', error);
          throw error;
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticated.set(false);
    this.userDataSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getUserData(): UserData | null {
    return this.userDataSubject.value;
  }

  /**
   * Obtiene el ID del rol del usuario actual
   * @returns El ID del rol o undefined si no hay usuario autenticado
   */
  getUserRole(): number | undefined {
    const userData = this.getUserData();
    if (!userData) return undefined;

    // Si el rol es un string, usar el mapeo
    if (typeof userData.rol === 'string') {
      return this.ROLE_MAP[userData.rol];
    }
    
    // Si el rol es un objeto, usar el id
    if (typeof userData.rol === 'object' && userData.rol !== null) {
      return userData.rol.id;
    }

    return undefined;
  }
  
  /**
   * Obtiene todos los roles disponibles desde el backend
   * @returns Observable con la lista de roles
   */
  getRoles(): Observable<{id: number, nombre: string}[]> {
    return this.http.get<{id: number, nombre: string}[]>(`${environment.apiUrl}/roles`)
      .pipe(
        tap(roles => {
          console.log('Roles obtenidos del backend:', roles);
          // Actualizar el mapeo de roles con los datos del backend
          roles.forEach(rol => {
            this.ROLE_MAP[rol.nombre] = rol.id;
          });
        }),
        catchError(error => {
          console.error('Error obteniendo roles:', error);
          return [];
        })
      );
  }
  
  /**
   * Obtiene los datos del usuario actual
   * @returns UserData | null
   */
  getCurrentUser(): UserData | null {
    return this.userDataSubject.value;
  }

  /**
   * Obtiene el ID del rol por su nombre
   * @param rolNombre Nombre del rol
   * @returns Observable con el ID del rol
   */
  getRoleIdByName(rolNombre: string): Observable<number> {
    return this.getRoles().pipe(
      map(roles => {
        const rol = roles.find(r => r.nombre === rolNombre);
        if (rol) {
          return rol.id;
        }
        // Si no se encuentra, usar el mapeo estático
        return this.ROLE_MAP[rolNombre] || 1;
      })
    );
  }
}