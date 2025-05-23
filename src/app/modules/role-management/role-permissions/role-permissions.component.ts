import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoleService, PermisoRol } from '../../../core/services/role.service';

interface RouteWithPermissions {
  idRuta: number;
  ruta: string;
  descripcion: string;
  nombreModulo: string;
  permisos: {
    puedeLeer: boolean;
    puedeEscribir: boolean;
    puedeActualizar: boolean;
    puedeEliminar: boolean;
  };
}

interface ModuleWithRoutes {
  nombre: string;
  rutas: RouteWithPermissions[];
  isExpanded?: boolean;
}

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.css']
})
export class RolePermissionsComponent implements OnInit {
  isLoading = false;
  roleId: number;
  roleName: string;
  routes: any[] = [];
  permissions: PermisoRol[] = [];
  moduleGroups: ModuleWithRoutes[] = [];
  searchText = '';
  totalRoutes = 0;

  constructor(
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RolePermissionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { roleId: number; roleName: string }
  ) {
    this.roleId = data.roleId;
    this.roleName = data.roleName;
  }

  ngOnInit(): void {
    if (this.roleId && this.roleId > 0) {
      this.loadData();
    } else {
      console.error('ID de rol inválido:', this.roleId);
      this.showSnackBar('Error: ID de rol inválido');
      this.isLoading = false;
      this.dialogRef.close(false);
    }
  }

  loadData(): void {
    this.isLoading = true;
    console.log(`Cargando datos para el rol con ID ${this.roleId} y nombre ${this.roleName}`);
    
    // Validar nuevamente que el ID del rol sea válido
    if (!this.roleId || this.roleId <= 0) {
      console.error('ID de rol inválido en loadData:', this.roleId);
      this.showSnackBar('Error: ID de rol inválido');
      this.isLoading = false;
      this.dialogRef.close(false);
      return;
    }
    
    // Primero cargamos todas las rutas
    this.roleService.getRoutes().subscribe({
      next: (routes) => {
        this.routes = routes;
        console.log(`Se cargaron ${routes.length} rutas`);
        
        // Luego cargamos los permisos del rol
        this.roleService.getRolePermissions(this.roleId).subscribe({
          next: (permissions) => {
            console.log(`Se cargaron ${permissions.length} permisos para el rol ${this.roleName}`);
            this.permissions = permissions;
            
            // Verificar que los permisos tengan el formato correcto
            if (permissions.length > 0) {
              console.log('Ejemplo de permiso cargado:', permissions[0]);
            } else {
              console.log('No se encontraron permisos para este rol. Se mostrarán todos los permisos desmarcados.');
            }
            
            this.processData();
            this.isLoading = false;
          },
          error: (error) => {
            console.error(`Error al cargar permisos para el rol con ID ${this.roleId}:`, error);
            this.showSnackBar('Error al cargar los permisos del rol');
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar rutas:', error);
        this.showSnackBar('Error al cargar las rutas del sistema');
        this.isLoading = false;
      }
    });
  }

  processData(): void {
    console.log('Procesando datos de permisos...');
    // Creamos un mapa para agrupar las rutas por módulo
    const moduleMap = new Map<string, RouteWithPermissions[]>();
    
    // Procesamos cada ruta
    this.routes.forEach(route => {
      // Buscamos si ya existe un permiso para esta ruta
      const existingPermission = this.permissions.find(p => p.idRuta === route.idRuta);
      
      if (existingPermission) {
        console.log(`Encontrado permiso para ruta ${route.ruta}:`, {
          puedeLeer: existingPermission.puedeLeer,
          puedeEscribir: existingPermission.puedeEscribir,
          puedeActualizar: existingPermission.puedeActualizar,
          puedeEliminar: existingPermission.puedeEliminar
        });
      }
      
      // Creamos el objeto de ruta con permisos
      const routeWithPermissions: RouteWithPermissions = {
        idRuta: route.idRuta,
        ruta: route.ruta,
        descripcion: route.descripcion,
        nombreModulo: route.nombreModulo,
        permisos: {
          puedeLeer: existingPermission ? existingPermission.puedeLeer : false,
          puedeEscribir: existingPermission ? existingPermission.puedeEscribir : false,
          puedeActualizar: existingPermission ? existingPermission.puedeActualizar : false,
          puedeEliminar: existingPermission ? existingPermission.puedeEliminar : false
        }
      };
      
      // Agrupamos por módulo
      if (!moduleMap.has(route.nombreModulo)) {
        moduleMap.set(route.nombreModulo, []);
      }
      moduleMap.get(route.nombreModulo)?.push(routeWithPermissions);
    });
    
    // Convertimos el mapa a un array de módulos con rutas
    this.moduleGroups = Array.from(moduleMap.entries()).map(([nombre, rutas]) => ({
      nombre,
      rutas,
      isExpanded: false // Inicialmente todos los módulos están colapsados
    }));
    
    // Ordenamos los módulos alfabéticamente
    this.moduleGroups.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Calculamos el total de rutas
    this.totalRoutes = this.routes.length;
    
    // Calculamos y mostramos el total de permisos por tipo
    console.log('Resumen de permisos procesados:');
    console.log(`- Permisos de lectura: ${this.getTotalPermissionsByType('puedeLeer')}`);
    console.log(`- Permisos de escritura: ${this.getTotalPermissionsByType('puedeEscribir')}`);
    console.log(`- Permisos de actualización: ${this.getTotalPermissionsByType('puedeActualizar')}`);
    console.log(`- Permisos de eliminación: ${this.getTotalPermissionsByType('puedeEliminar')}`);
    
    // Expandir automáticamente los módulos si el rol tiene muchos permisos (como admin)
    const totalPermisos = this.getTotalPermissionsByType('puedeLeer') + 
                         this.getTotalPermissionsByType('puedeEscribir') + 
                         this.getTotalPermissionsByType('puedeActualizar') + 
                         this.getTotalPermissionsByType('puedeEliminar');
                         
    if (totalPermisos > this.totalRoutes * 2) { // Si tiene más de la mitad de los permisos posibles
      console.log('Este rol tiene muchos permisos, expandiendo módulos automáticamente');
      this.moduleGroups.forEach(module => module.isExpanded = true);
    }
  }

  filterRoutes(): ModuleWithRoutes[] {
    if (!this.searchText.trim()) {
      return this.moduleGroups;
    }
    
    const searchLower = this.searchText.toLowerCase();
    
    // Si hay un término de búsqueda, expandimos automáticamente los módulos que tienen coincidencias
    return this.moduleGroups
      .map(module => {
        const filteredRoutes = module.rutas.filter(route => 
          route.ruta.toLowerCase().includes(searchLower) || 
          (route.descripcion && route.descripcion.toLowerCase().includes(searchLower))
        );
        
        return {
          nombre: module.nombre,
          rutas: filteredRoutes,
          isExpanded: filteredRoutes.length > 0 // Expandimos automáticamente si hay coincidencias
        };
      })
      .filter(module => module.rutas.length > 0);
  }
  
  /**
   * Limpia el campo de búsqueda
   */
  clearSearch(): void {
    this.searchText = '';
    // Restauramos el estado de expansión de los módulos
    this.moduleGroups.forEach(module => module.isExpanded = false);
  }
  
  /**
   * Obtiene el número total de rutas filtradas
   */
  getTotalFilteredRoutes(): number {
    if (!this.searchText.trim()) {
      return this.totalRoutes;
    }
    
    return this.filterRoutes()
      .reduce((total, module) => total + module.rutas.length, 0);
  }
  
  /**
   * Obtiene el número total de permisos de un tipo específico
   * @param permissionType Tipo de permiso (puedeLeer, puedeEscribir, puedeActualizar, puedeEliminar)
   * @returns Número total de permisos de ese tipo
   */
  getTotalPermissionsByType(permissionType: 'puedeLeer' | 'puedeEscribir' | 'puedeActualizar' | 'puedeEliminar'): number {
    let total = 0;
    
    this.moduleGroups.forEach(module => {
      module.rutas.forEach(route => {
        if (route.permisos && route.permisos[permissionType]) {
          total++;
        }
      });
    });
    
    return total;
  }

  savePermissions(): void {
    this.isLoading = true;
    
    // Verificar que el ID del rol sea válido
    if (!this.roleId || isNaN(this.roleId) || this.roleId <= 0) {
      console.error('ID de rol inválido:', this.roleId);
      this.showSnackBar('Error: ID de rol inválido');
      this.isLoading = false;
      return;
    }
    
    console.log('Preparando permisos para guardar. ID del rol:', this.roleId);
    
    // Crear un array para almacenar solo los permisos esenciales
    const permissionsToSave: PermisoRol[] = [];
    
    try {
      // Recorrer todos los módulos y rutas para obtener los permisos actualizados
      this.moduleGroups.forEach(module => {
        module.rutas.forEach(route => {
          // Verificar que la ruta tenga un ID válido
          if (!route.idRuta || isNaN(route.idRuta)) {
            console.warn('Ruta sin ID válido:', route);
            return; // Saltar esta ruta
          }
          
          // Crear objeto de permiso con solo los campos necesarios
          const permission: PermisoRol = {
            idRol: this.roleId,
            idRuta: route.idRuta,
            puedeLeer: !!route.permisos.puedeLeer, // Convertir a booleano
            puedeEscribir: !!route.permisos.puedeEscribir,
            puedeActualizar: !!route.permisos.puedeActualizar,
            puedeEliminar: !!route.permisos.puedeEliminar,
            estado: true
          };
          
          permissionsToSave.push(permission);
        });
      });
      
      // Verificar que haya permisos para guardar
      if (permissionsToSave.length === 0) {
        throw new Error('No hay permisos para guardar');
      }
      
      console.log(`Guardando ${permissionsToSave.length} permisos para el rol ${this.roleId}`);
      
      this.roleService.updateRolePermissions(this.roleId, permissionsToSave).subscribe({
        next: (response) => {
          console.log('Respuesta exitosa al guardar permisos:', response);
          this.showSnackBar('Permisos actualizados correctamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al guardar permisos:', error);
          
          // Manejar diferentes tipos de errores
          let errorMessage = 'Error al guardar los permisos';
          
          if (error && error.message) {
            // Extraer mensaje de error más descriptivo
            if (error.message.includes('Http failure')) {
              if (error.status === 500) {
                errorMessage = 'Error interno del servidor. Contacte al administrador.';
              } else {
                errorMessage = `Error de comunicación con el servidor (${error.status})`;
              }
            } else {
              errorMessage = error.message;
            }
          }
          
          this.showSnackBar(errorMessage);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error al preparar los permisos:', error);
      this.showSnackBar(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      this.isLoading = false;
    }
  }

  toggleAllPermissions(module: ModuleWithRoutes, permission: string, value: boolean): void {
    module.rutas.forEach(route => {
      switch (permission) {
        case 'read':
          route.permisos.puedeLeer = value;
          break;
        case 'write':
          route.permisos.puedeEscribir = value;
          break;
        case 'update':
          route.permisos.puedeActualizar = value;
          break;
        case 'delete':
          route.permisos.puedeEliminar = value;
          break;
      }
    });
  }

  toggleAllModulePermissions(module: ModuleWithRoutes, value: boolean): void {
    module.rutas.forEach(route => {
      route.permisos.puedeLeer = value;
      route.permisos.puedeEscribir = value;
      route.permisos.puedeActualizar = value;
      route.permisos.puedeEliminar = value;
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  showSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
