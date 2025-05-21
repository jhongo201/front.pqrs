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
        this.menuModules = response.modulos;
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
    const normalizedUrl = url.split('?')[0]; // Eliminar parámetros de consulta
    
    // Buscar en todos los módulos y rutas
    for (const modulo of this.menuModules) {
      for (const ruta of modulo.rutas) {
        // Convertir la ruta del backend a una ruta de frontend
        const frontendRoute = this.backendToFrontendRoute(ruta.ruta);
        
        // Si la URL actual comienza con la ruta del frontend
        if (normalizedUrl.startsWith(frontendRoute)) {
          this.setActiveMenuItem(modulo.id, ruta.id);
          this.openModules[modulo.id] = true; // Abrir el módulo
          return;
        }
      }
    }
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
    // Ejemplo: /pqrs -> /pqrs-list
    const routeMapping: {[key: string]: string} = {
      '/usuarios': '/usuarios',
      '/pqrs': '/pqrs'
      // Agregar más mapeos según sea necesario
    };
    
    // Aplicar mapeo si existe
    return routeMapping[frontendRoute] || frontendRoute;
  }

} 
 