import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleService, Role } from '../../../core/services/role.service';

@Component({
  selector: 'app-role-form',
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
    MatTooltipModule
  ],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.css']
})
export class RoleFormComponent implements OnInit {
  roleForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  title = 'Crear Nuevo Rol';
  roleId: number;
  roleName: string;
  role: Role | null = null;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RoleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { roleId?: number; roleName?: string; role?: Role | null }
  ) {
    // Inicializar igual que en el componente de permisos
    this.roleId = data.roleId || 0;
    this.roleName = data.roleName || '';
    this.role = data.role || null;
    
    this.roleForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(200)],
      estado: [true]
    });
  }

  ngOnInit(): void {
    console.log('RoleFormComponent - ngOnInit - roleId:', this.roleId);
    console.log('RoleFormComponent - ngOnInit - roleName:', this.roleName);
    console.log('RoleFormComponent - ngOnInit - role:', this.role);
    
    if (this.roleId && this.roleId > 0) {
      // Modo edición
      this.isEditMode = true;
      this.title = `Editar Rol: ${this.roleName}`;
      
      if (this.role) {
        // Si ya tenemos los datos del rol, los usamos
        this.roleForm.patchValue({
          nombre: this.role.nombre,
          descripcion: this.role.descripcion || '',
          estado: this.role.estado
        });
      }
    } else {
      // Modo creación
      this.isEditMode = false;
      this.title = 'Crear Nuevo Rol';
    }
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched(this.roleForm);
      return;
    }
    
    this.isLoading = true;
    
    // Verificar el ID del rol
    console.log('onSubmit - roleId:', this.roleId);
    console.log('onSubmit - role:', this.role);
    
    // Modo creación o edición
    if (this.isEditMode && this.roleId > 0) {
      console.log('Actualizando rol con ID:', this.roleId);
      
      // Crear objeto para actualizar
      const roleData: Partial<Role> = {
        nombre: this.roleForm.value.nombre,
        descripcion: this.roleForm.value.descripcion || '',
        estado: this.roleForm.value.estado
      };
      
      // Actualizar el rol usando el roleId
      this.updateRole(this.roleId, roleData as Role);
    } else {
      console.log('Creando nuevo rol');
      
      // Modo creación
      const roleData: Role = {
        ...this.roleForm.value,
        id: 0 // El backend ignorará este valor
      };
      
      this.createRole(roleData);
    }
  }

  createRole(role: Role): void {
    // Asegurarse de que el objeto role tiene la estructura correcta
    // Omitimos el id ya que el backend lo generará
    const roleToCreate: Partial<Role> = {
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      estado: role.estado
    };

    console.log('Enviando datos para crear rol:', roleToCreate);

    this.roleService.createRole(roleToCreate as Role).subscribe({
      next: (response) => {
        console.log('Respuesta exitosa al crear rol:', response);
        this.showSnackBar('Rol creado correctamente');
        this.dialogRef.close(true);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al crear rol:', error);
        this.showSnackBar('Error al crear el rol');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  updateRole(id: number, role: Role): void {
    // Crear objeto con los datos necesarios para la actualización
    const roleToUpdate: Partial<Role> = {
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      estado: role.estado
    };

    this.roleService.updateRole(id, roleToUpdate as Role).subscribe({
      next: (response) => {
        this.showSnackBar('Rol actualizado correctamente');
        this.dialogRef.close(true);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al actualizar rol:', error);
        this.showSnackBar('Error al actualizar el rol');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
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

  // Marcar todos los controles del formulario como 'touched'
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
