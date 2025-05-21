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

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RoleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { role: Role | null }
  ) {
    this.roleForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(200)],
      estado: [true]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.role) {
      this.isEditMode = true;
      this.title = 'Editar Rol';
      this.roleForm.patchValue({
        nombre: this.data.role.nombre,
        descripcion: this.data.role.descripcion || '',
        estado: this.data.role.estado
      });
    }
  }

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.markFormGroupTouched(this.roleForm);
      return;
    }

    this.isLoading = true;
    const roleData: Role = {
      ...this.roleForm.value,
      id: this.isEditMode && this.data.role ? this.data.role.id : 0
    };

    if (this.isEditMode && this.data.role) {
      this.updateRole(this.data.role.id, roleData);
    } else {
      this.createRole(roleData);
    }
  }

  createRole(role: Role): void {
    this.roleService.createRole(role).subscribe({
      next: (response) => {
        this.showSnackBar('Rol creado correctamente');
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al crear rol:', error);
        this.showSnackBar('Error al crear el rol');
        this.isLoading = false;
      }
    });
  }

  updateRole(id: number, role: Role): void {
    this.roleService.updateRole(id, role).subscribe({
      next: (response) => {
        this.showSnackBar('Rol actualizado correctamente');
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al actualizar rol:', error);
        this.showSnackBar('Error al actualizar el rol');
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
