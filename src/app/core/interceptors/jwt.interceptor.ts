import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Valida si un token JWT tiene el formato correcto
 * @param token El token JWT a validar
 * @returns true si el token tiene un formato válido, false en caso contrario
 */
function isValidJwtFormat(token: string): boolean {
  // Un token JWT válido debe tener exactamente 2 puntos (3 partes)
  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Limpia un token JWT de posibles caracteres no deseados
 * @param token El token JWT a limpiar
 * @returns El token limpio o null si no es válido
 */
function sanitizeToken(token: string): string | null {
  // Eliminar espacios en blanco y otros caracteres no deseados
  const cleanToken = token.trim();
  
  // Verificar si el token limpio tiene un formato válido
  if (isValidJwtFormat(cleanToken)) {
    return cleanToken;
  }
  
  // Registrar el error para depuración
  console.error('Token JWT inválido detectado en el cliente:', {
    token: token.length > 20 ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : token,
    puntos: token.split('.').length - 1
  });
  
  return null;
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const rawToken = localStorage.getItem('token');

  // No interceptar peticiones de autenticación y PQRS públicas
  if (req.url.includes('/auth/login') || 
      req.url.includes('/registro-externo') ||
      req.url.includes('/api/pqrs/consulta/') ||  // Consulta PQRS pública
      req.url.includes('/api/pqrs/radicado/') ||  // Consulta por radicado
      (req.url.includes('/api/pqrs/publico') && req.method === 'POST' && !rawToken)) {
    return next(req);
  }

  if (rawToken) {
    // Validar y limpiar el token
    const validToken = sanitizeToken(rawToken);
    
    if (validToken) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${validToken}`
        }
      });
    } else {
      // Si el token es inválido, eliminarlo y redirigir al login
      console.warn('Se detectó un token inválido. Redirigiendo al login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.navigate(['/login'], { 
        queryParams: { expired: 'true', reason: 'invalid_token' },
        replaceUrl: true
      });
      return next(req); // Continuar sin token
    }
  }

  return next(req).pipe(
    catchError((error) => {
      // Verificar si es un endpoint público de PQRS
      const isPublicPqrsEndpoint = req.url.includes('/api/pqrs/consulta/') || 
                                   req.url.includes('/api/pqrs/radicado/') ||
                                   req.url.includes('/api/pqrs/publico');
      
      if ((error.status === 401 || error.status === 403) && !isPublicPqrsEndpoint) {
        // Solo limpiar y redirigir si NO es un endpoint público
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
