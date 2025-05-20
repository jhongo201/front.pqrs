import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  // No interceptar peticiones de autenticación
  if (req.url.includes('/auth/login') || req.url.includes('/registro-externo')) {
    return next(req);
  }

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 || error.status === 403) {
        // Limpiar almacenamiento local
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Silenciosamente redirigir al login
        router.navigate(['/login'], { 
          queryParams: { expired: 'true' },
          replaceUrl: true // Reemplaza la URL actual en el historial
        });
      }
      return throwError(() => error);
    })
  );
  
};
