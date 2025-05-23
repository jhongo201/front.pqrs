import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoleService, Role } from '../../core/services/role.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoleFormComponent } from './role-form/role-form.component';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ConfirmDialogComponent,
    RoleFormComponent,
    RolePermissionsComponent
  ],
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.css']
})
export class RoleManagementComponent implements OnInit {
  roles: Role[] = [];
  displayedColumns: string[] = ['id', 'nombre', 'descripcion', 'estado', 'acciones'];
  isLoading = false;
  error: string | null = null;
  searchForm: FormGroup;
  filteredRoles: Role[] = [];

  constructor(
    private roleService: RoleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.setupSearchListener();
  }

  setupSearchListener(): void {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.filterRoles(value);
    });
  }

  filterRoles(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredRoles = [...this.roles];
      return;
    }

    searchTerm = searchTerm.toLowerCase();
    this.filteredRoles = this.roles.filter(role => 
      role.nombre.toLowerCase().includes(searchTerm) || 
      (role.descripcion && role.descripcion.toLowerCase().includes(searchTerm))
    );
  }

  loadRoles(): void {
    this.isLoading = true;
    this.error = null;
    this.roleService.getRoles().subscribe({
      next: (data) => {
        // Asegurarse de que todos los IDs sean números
        this.roles = data.map(role => ({
          ...role,
          id: Number(role.id) // Convertir explícitamente a número
        }));
        
        console.log('Roles cargados y procesados:', this.roles);
        this.filteredRoles = [...this.roles];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.error = 'Error al cargar los roles. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  openRoleForm(role?: Role): void {
    this.error = null;
    
    if (role) {
      // Obtener el ID del rol de manera segura (puede estar en id o idRol)
      // @ts-ignore - Ignorar error de TypeScript por propiedad idRol
      const roleId = (!isNaN(role.id) && role.id) ? role.id : (role.idRol || null);
      
      console.log('ID del rol a editar:', roleId);
      console.log('Datos completos del rol:', role);
      
      if (!role || !roleId) {
        console.error('Error: Rol inválido o sin ID', role);
        this.showSnackBar('Error: No se puede editar este rol');
        return;
      }
      
      console.log(`Abriendo modal de edición para rol: ${role.nombre} (ID: ${roleId})`);
      
      // Crear una copia del rol con el ID correcto
      const roleToEdit = {
        ...role,
        id: roleId  // Asegurarse de que id tenga el valor correcto
      };
      
      const dialogRef = this.dialog.open(RoleFormComponent, {
        width: '500px',
        data: { roleId: roleId, roleName: role.nombre, role: roleToEdit }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadRoles();
        }
      });
    } else {
      // Crear nuevo rol
      const dialogRef = this.dialog.open(RoleFormComponent, {
        width: '500px',
        data: { role: null }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadRoles();
        }
      });
    }
  }

  openPermissionsDialog(role: any): void {
    // Validar que el rol tenga un ID válido (puede ser id o idRol)
    const roleId = role.id || role.idRol;
    
    if (!role || !roleId) {
      console.error('Error: Rol inválido o sin ID', role);
      this.showSnackBar('Error: No se puede gestionar permisos para este rol');
      return;
    }
    
    console.log(`Abriendo modal de permisos para rol: ${role.nombre} (ID: ${roleId})`);
    
    const dialogRef = this.dialog.open(RolePermissionsComponent, {
      width: '800px',
      data: { roleId: roleId, roleName: role.nombre }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSnackBar('Permisos actualizados correctamente.');
      }
    });
  }

  confirmDeleteRole(role: Role): void {
    // Verificar que el rol tenga un ID válido
    // @ts-ignore - Ignorar error de TypeScript por propiedad idRol
    const roleId = (!isNaN(role.id) && role.id) ? role.id : (role.idRol || null);
    
    if (!roleId) {
      console.error('Error: Rol inválido o sin ID', role);
      this.showSnackBar('Error: No se puede eliminar este rol (ID inválido)');
      return;
    }
    
    console.log(`Confirmando eliminación del rol: ${role.nombre} (ID: ${roleId})`);
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: false,
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro que desea eliminar el rol "${role.nombre}"?`,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteRole(roleId);
      }
    });
  }

  deleteRole(id: number): void {
    // Validar que el ID sea un número válido
    if (!id || isNaN(id) || id <= 0) {
      console.error('Error: ID de rol inválido para eliminación:', id);
      this.showSnackBar('Error: No se puede eliminar el rol con ID inválido');
      return;
    }
    
    console.log(`Eliminando rol con ID: ${id}`);
    this.isLoading = true;
    
    this.roleService.deleteRole(id).subscribe({
      next: () => {
        console.log(`Rol con ID ${id} eliminado correctamente`);
        this.showSnackBar('Rol eliminado correctamente');
        this.loadRoles();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(`Error al eliminar rol con ID ${id}:`, err);
        this.showSnackBar('Error al eliminar el rol. Intente nuevamente.');
        this.isLoading = false;
      }
    });
  }
  
  toggleRoleStatus(role: Role): void {
    // Obtener el ID del rol de manera segura (puede estar en id o idRol)
    // @ts-ignore - Ignorar error de TypeScript por propiedad idRol
    const roleId = (!isNaN(role.id) && role.id) ? role.id : (role.idRol || null);
    
    if (!roleId) {
      console.error('Error: Rol inválido o sin ID', role);
      this.showSnackBar('Error: No se puede cambiar el estado de este rol');
      return;
    }
    
    // Invertir el estado actual del rol
    const newStatus = !role.estado;
    const statusText = newStatus ? 'activado' : 'desactivado';
    
    console.log(`Cambiando estado del rol ${role.nombre} (ID: ${roleId}) a ${statusText}`);
    
    // Crear objeto con solo los datos necesarios para actualizar
    const roleData: Partial<Role> = {
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      estado: newStatus
    };

    this.isLoading = true;
    this.roleService.updateRole(roleId, roleData as Role).subscribe({
      next: () => {
        this.showSnackBar(`Rol ${newStatus ? 'activado' : 'desactivado'} correctamente`);
        this.loadRoles();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al actualizar el estado del rol', err);
        this.showSnackBar('No se pudo actualizar el estado del rol');
        this.isLoading = false;
      }
    });
  }

  showSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
