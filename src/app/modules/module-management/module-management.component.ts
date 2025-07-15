import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ModuleService, Module } from '../../core/services/module.service';

@Component({
  selector: 'app-module-management',
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
    ConfirmDialogComponent
  ],
  templateUrl: './module-management.component.html',
  styleUrls: ['./module-management.component.css']
})
export class ModuleManagementComponent implements OnInit {
  modules: Module[] = [];
  displayedColumns: string[] = ['index', 'nombre', 'descripcion', 'estado', 'acciones'];
  isLoading = false;
  error: string | null = null;
  searchForm: FormGroup;
  filteredModules: Module[] = [];

  constructor(
    private moduleService: ModuleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    this.loadModules();
    this.setupSearchListener();
  }

  setupSearchListener(): void {
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(term => {
      this.filterModules(term);
    });
  }

  filterModules(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredModules = [...this.modules];
      return;
    }

    searchTerm = searchTerm.toLowerCase().trim();
    this.filteredModules = this.modules.filter(module => 
      module.nombre.toLowerCase().includes(searchTerm) ||
      module.descripcion.toLowerCase().includes(searchTerm)
    );
  }

  loadModules(): void {
    this.isLoading = true;
    this.error = null;

    this.moduleService.getModules().subscribe({
      next: (data: Module[]) => {
        this.modules = data;
        this.filteredModules = [...data];
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error al cargar módulos:', err);
        this.error = err.message || 'No se pudieron cargar los módulos. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  openModuleForm(module?: Module): void {
    import('./module-form/module-form.component').then(({ ModuleFormComponent }) => {
      const dialogRef = this.dialog.open(ModuleFormComponent, {
        width: '500px',
        disableClose: true,
        data: { module }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('Módulo guardado:', result);
          const action = module ? 'actualizado' : 'creado';
          this.showSnackBar(`Módulo ${action} correctamente`);
          this.loadModules();
        }
      });
    });
  }

  confirmDeleteModule(module: Module): void {
    // Verificar que el módulo tenga un ID válido
    const moduleId = module.id;
    
    if (!moduleId || isNaN(moduleId) || moduleId <= 0) {
      console.error('Error: Módulo inválido o sin ID', module);
      this.showSnackBar('Error: No se puede eliminar este módulo (ID inválido)');
      return;
    }
    
    console.log(`Confirmando eliminación del módulo: ${module.nombre} (ID: ${moduleId})`);
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: false,
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro que desea eliminar el módulo "${module.nombre}"?`,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteModule(moduleId);
      }
    });
  }

  deleteModule(id: number): void {
    console.log(`Solicitando eliminación del módulo con ID: ${id}`);
    this.isLoading = true;
    
    this.moduleService.deleteModule(id).subscribe({
      next: () => {
        console.log(`Módulo con ID ${id} eliminado correctamente`);
        this.showSnackBar('Módulo eliminado correctamente');
        this.loadModules();
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error(`Error al eliminar módulo con ID ${id}:`, err);
        this.showSnackBar(err.message || 'Error al eliminar el módulo. Intente nuevamente.');
        this.isLoading = false;
      }
    });
  }

  toggleModuleStatus(module: Module): void {
    const moduleId = module.id;
    const currentStatus = module.estado;
    const statusText = !currentStatus ? 'activado' : 'desactivado';
    
    console.log(`Cambiando estado del módulo ${module.nombre} (ID: ${moduleId}) a ${statusText}`);
    this.isLoading = true;
    
    this.moduleService.toggleModuleStatus(moduleId, currentStatus).subscribe({
      next: () => {
        console.log(`Módulo ${statusText} correctamente`);
        this.showSnackBar(`Módulo ${statusText} correctamente`);
        this.loadModules(); // Recargar la lista de módulos
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error(`Error al ${!currentStatus ? 'activar' : 'desactivar'} módulo:`, err);
        this.showSnackBar(err.message || `Error al ${!currentStatus ? 'activar' : 'desactivar'} el módulo`);
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
