import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { UserData } from '../../shared/models/user.model'; // Asegúrate de tener la ruta correcta

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.isAuthenticated.set(!!localStorage.getItem('token'));
  }

  login(credentials: { username: string; password: string }) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials)
      .subscribe({
        next: (response) => {
          // Guardar el token
          localStorage.setItem('token', response.token);
          
          // Guardar los datos del usuario
          const userData = {
            username: response.username,
            nombreCompleto: response.nombreCompleto,
            rol: response.rol,
            empresa: response.empresa,
            direccion: response.direccion,
            area: response.area
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          this.isAuthenticated.set(true);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error en login:', error);
        }
      });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn() {
    return this.isAuthenticated();
  }

  getUserData(): UserData | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  getCurrentUser(): UserData | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Métodos para restablecimiento de contraseña
  solicitarRestablecimiento(email: string) {
    return this.http.post<any>(`${environment.apiUrl}/usuarios/solicitar-restablecimiento`, {
      email: email
    });
  }

  validarToken(token: string) {
    return this.http.get<any>(`${environment.apiUrl}/usuarios/validar-token-restablecimiento/${token}`);
  }

  restablecerPassword(token: string, nuevaPassword: string, confirmarPassword: string) {
    return this.http.post<any>(`${environment.apiUrl}/usuarios/restablecer-password`, {
      token: token,
      nuevaPassword: nuevaPassword,
      confirmarPassword: confirmarPassword
    });
  }
}