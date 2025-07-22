import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MenuService, ModuloMenu, RutaMenu } from '../../core/services/menu.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'], // Ajusta según tu estructura
})
export class MenuComponent implements OnInit {

  // Estado de los menús
  menuModules: ModuloMenu[] = [];
  openModules: { [key: number]: boolean } = {};
  activeMenuItem: string | null = null;
  activeSubmenuItem: string | null = null;
  isLoading = true;

  constructor(
    public authService: AuthService,
    private menuService: MenuService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Cargar las opciones de menú
    this.loadMenuOptions();

    // Actualizar el menú activo basado en la ruta actual
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveMenuFromUrl(this.router.url);
    });
  }

  /**
   * Carga las opciones de menú desde el backend
   */
  loadMenuOptions(): void {
    this.isLoading = true;
    this.menuService.loadMenuOptions().subscribe({
      next: (response) => {
        // Filtrar rutas que no deben aparecer en el menú
        const modulosConRutasFiltradas = response.modulos.map(modulo => ({
          ...modulo,
          rutas: modulo.rutas.filter(ruta => this.shouldShowInMenu(ruta.ruta))
        }));
        
        // Filtrar módulos que quedaron sin rutas visibles
        this.menuModules = modulosConRutasFiltradas.filter(modulo => {
          const tieneRutasVisibles = modulo.rutas.length > 0;
          if (!tieneRutasVisibles) {
            console.log(`🚫 Módulo '${modulo.nombre}' oculto - no tiene rutas visibles en el menú`);
          }
          return tieneRutasVisibles;
        });
        
        console.log('📋 Módulos finales en menú:', this.menuModules.map(m => `${m.nombre} (${m.rutas.length} rutas)`));
        this.isLoading = false;
        // Inicializar todos los módulos como cerrados
        this.menuModules.forEach(modulo => {
          this.openModules[modulo.id] = false;
        });
        // Actualizar el menú activo basado en la URL actual
        this.updateActiveMenuFromUrl(this.router.url);
      },
      error: (error) => {
        console.error('Error al cargar el menú:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Alterna la visibilidad de un módulo del menú
   * @param moduleId ID del módulo a alternar
   */
  toggleModule(moduleId: number): void {
    // Cerrar todos los demás módulos
    Object.keys(this.openModules).forEach(key => {
      const id = parseInt(key);
      if (id !== moduleId) {
        this.openModules[id] = false;
      }
    });
    // Alternar el módulo seleccionado
    this.openModules[moduleId] = !this.openModules[moduleId];
  }

  /**
   * Establece el elemento de menú activo
   * @param moduleId ID del módulo
   * @param routeId ID de la ruta
   */
  setActiveMenuItem(moduleId: number, routeId: number): void {
    this.activeMenuItem = `module-${moduleId}`;
    this.activeSubmenuItem = `route-${routeId}`;
  }

  /**
   * Verifica si un elemento del submenú está activo
   * @param routeId ID de la ruta
   * @returns true si la ruta está activa
   */
  isSubmenuItemActive(routeId: number): boolean {
    return this.activeSubmenuItem === `route-${routeId}`;
  }

  /**
   * Verifica si un módulo está activo
   * @param moduleId ID del módulo
   * @returns true si el módulo está activo
   */
  isModuleActive(moduleId: number): boolean {
    return this.activeMenuItem === `module-${moduleId}`;
  }

  /**
   * Actualiza el menú activo basado en la URL actual
   * @param url URL actual
   */
  private updateActiveMenuFromUrl(url: string): void {
    // Normalizar la URL para comparación
    const normalizedUrl = url.split('?')[0].split('#')[0]; // Eliminar parámetros y fragmentos
    console.log('🔍 MenuComponent - Detectando ruta activa:', normalizedUrl);
    
    // Limpiar estado activo anterior
    this.activeMenuItem = null;
    this.activeSubmenuItem = null;
    
    // Casos especiales para rutas principales
    if (normalizedUrl === '/dashboard' || normalizedUrl === '/') {
      this.setActiveMenuItem(0, 0);
      console.log('✅ MenuComponent - Dashboard marcado como activo');
      return;
    }
    
    // Buscar en todos los módulos y rutas
    let bestMatch: { modulo: ModuloMenu | null, ruta: RutaMenu | null, matchLength: number } = { 
      modulo: null, 
      ruta: null, 
      matchLength: 0 
    };
    
    for (const modulo of this.menuModules) {
      for (const ruta of modulo.rutas) {
        // Convertir la ruta del backend a una ruta de frontend
        const frontendRoute = this.backendToFrontendRoute(ruta.ruta);
        
        // Verificar coincidencia exacta o por prefijo
        const isExactMatch = normalizedUrl === frontendRoute;
        const isPartialMatch = normalizedUrl.startsWith(frontendRoute + '/') || 
                              (frontendRoute !== '/' && normalizedUrl.startsWith(frontendRoute));
        
        if (isExactMatch || isPartialMatch) {
          const matchLength = frontendRoute.length;
          
          // Preferir coincidencias más específicas (rutas más largas)
          if (matchLength > bestMatch.matchLength) {
            bestMatch = { modulo, ruta, matchLength };
          }
        }
      }
    }
    
    // Aplicar la mejor coincidencia encontrada
    if (bestMatch.modulo && bestMatch.ruta) {
      this.setActiveMenuItem(bestMatch.modulo.id, bestMatch.ruta.id);
      this.openModules[bestMatch.modulo.id] = true; // Abrir el módulo
      console.log('✅ MenuComponent - Ruta activa detectada:', {
        modulo: bestMatch.modulo.nombre,
        ruta: bestMatch.ruta.descripcion,
        url: normalizedUrl
      });
    } else {
      console.log('⚠️ MenuComponent - No se encontró coincidencia para:', normalizedUrl);
    }
  }

  /**
   * Determina si una ruta debe mostrarse en el menú
   * @param ruta Ruta a evaluar
   * @returns true si la ruta debe aparecer en el menú
   */
  private shouldShowInMenu(ruta: string): boolean {
    // Filtrar rutas con parámetros dinámicos
    if (ruta.includes('{') && ruta.includes('}')) {
      return false;
    }
    
    // Filtrar rutas específicas que no deben aparecer en el menú
    const excludedRoutes = [
      '/api/pqrs/nuevo',           // Ruta de creación (se accede desde botón)
      '/api/pqrs/seguimiento',     // Ruta de seguimiento (se accede desde detalle)
      '/api/usuarios/perfil',      // Ruta de perfil (se accede desde header)
      '/api/auth/logout'           // Ruta de logout (se accede desde header)
    ];
    
    // Verificar rutas excluidas generales
    if (excludedRoutes.includes(ruta)) {
      return false;
    }
    
    // Filtrado basado en roles: Ocultar /usuarios para rol OPERADOR
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.rol) {
      const userRole = typeof currentUser.rol === 'string' 
        ? currentUser.rol 
        : currentUser.rol.nombre;
      
      // Si el usuario es OPERADOR, ocultar la ruta /api/usuarios
      if (userRole === 'OPERADOR' && (ruta === '/api/usuarios' || ruta === '/usuarios')) {
        console.log('🚫 MenuComponent - Ocultando ruta /usuarios para usuario OPERADOR');
        return false;
      }
    }
    
    return true;
  }

  /**
   * Convierte una ruta de backend a una ruta de frontend
   * @param backendRoute Ruta del backend (ej: /api/usuarios)
   * @returns Ruta del frontend (ej: /usuarios)
   */
  backendToFrontendRoute(backendRoute: string): string {
    // Eliminar el prefijo /api si existe
    let frontendRoute = backendRoute.startsWith('/api') ? backendRoute.substring(4) : backendRoute;
    
    // Mapeo específico de rutas (personalizar según tu aplicación)
    const routeMapping: {[key: string]: string} = {
      '/usuarios': '/usuarios',
      '/pqrs': '/pqrs',
      '/pqrs/crear': '/pqrs/crear',
      '/pqrs/mis-pqrs': '/pqrs/mis-pqrs',
      '/reportes': '/reportes',
      '/dashboard': '/dashboard',
      '/estadisticas': '/estadisticas'
      // Agregar más mapeos según sea necesario
    };
    
    // Aplicar mapeo si existe, sino usar la ruta tal como viene
    const mappedRoute = routeMapping[frontendRoute] || frontendRoute;
    
    console.log('🔄 MenuComponent - Mapeo de ruta:', {
      backend: backendRoute,
      frontend: mappedRoute
    });
    
    return mappedRoute;
  }

} 
 