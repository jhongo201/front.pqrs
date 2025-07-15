import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Module, ModuleService } from '../../../core/services/module.service';

@Component({
  selector: 'app-module-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './module-form.component.html',
  styleUrls: ['./module-form.component.css']
})
export class ModuleFormComponent implements OnInit {
  moduleForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  isEditMode = false;
  formTitle = 'Crear Módulo';
  submitButtonText = 'Crear';
  moduleId: number | null = null; // Almacenar el ID del módulo para actualización
  currentModule: Module | null = null; // Referencia al módulo actual para edición

  constructor(
    private fb: FormBuilder,
    private moduleService: ModuleService,
    public dialogRef: MatDialogRef<ModuleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { module?: Module }
  ) {
    this.moduleForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(255)],
      estado: [true]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.module) {
      this.isEditMode = true;
      this.formTitle = 'Editar Módulo';
      this.submitButtonText = 'Actualizar';
      this.currentModule = this.data.module; // Guardar referencia al módulo completo
      this.moduleId = this.data.module.id; // Guardar el ID del módulo para actualización
      this.populateForm(this.data.module);
      console.log('Módulo a editar ID:', this.moduleId, 'Nombre:', this.currentModule.nombre);
    }
  }

  populateForm(module: Module): void {
    this.moduleForm.patchValue({
      nombre: module.nombre,
      descripcion: module.descripcion || '',
      estado: module.estado
    });
  }

  onSubmit(): void {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const moduleData = this.moduleForm.value;

    if (this.isEditMode && this.moduleId) {
      console.log('Actualizando módulo con ID:', this.moduleId);
      this.updateModule(this.moduleId, moduleData);
    } else {
      this.createModule(moduleData);
    }
  }

  createModule(moduleData: Partial<Module>): void {
    this.moduleService.createModule(moduleData).subscribe({
      next: (newModule) => {
        console.log('Módulo creado:', newModule);
        this.isLoading = false;
        this.dialogRef.close(newModule);
      },
      error: (err: Error) => {
        console.error('Error al crear módulo:', err);
        this.error = err.message || 'Error al crear el módulo. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  updateModule(id: number, moduleData: Partial<Module>): void {
    this.moduleService.updateModule(id, moduleData).subscribe({
      next: (updatedModule) => {
        console.log('Módulo actualizado:', updatedModule);
        this.isLoading = false;
        this.dialogRef.close(updatedModule);
      },
      error: (err: Error) => {
        console.error('Error al actualizar módulo:', err);
        this.error = err.message || 'Error al actualizar el módulo. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Helpers para validación de formularios
  hasError(controlName: string, errorName: string): boolean {
    const control = this.moduleForm.get(controlName);
    return !!control && control.hasError(errorName) && control.touched;
  }
}
