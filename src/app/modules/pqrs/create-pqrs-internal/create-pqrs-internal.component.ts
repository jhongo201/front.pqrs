// create-pqrs-internal.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PqrsService } from '../../../core/services/pqrs.service';
import { HttpResponse, HttpEvent } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { uploadProgress } from '../../../shared/operators/upload-progress.operator';

// Interfaces
interface FilePreview {
  name: string;
  size: string;
  type: string;
  url?: string;
}

@Component({
  selector: 'app-create-pqrs-internal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-pqrs-internal.component.html',
  styleUrls: ['./create-pqrs-internal.component.css']
})
export class CreatePqrsInternalComponent implements OnInit {
  pqrsForm: FormGroup;
  temas: any[] = [];
  isLoading = false;
  error = '';
  archivoSeleccionado: File | null = null;
  prioridades = ['BAJA', 'MEDIA', 'ALTA'];
  successMessage: string = '';
  uploadProgress: number = 0;
  readonly ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
  fileError: string = '';
  filePreview: FilePreview | null = null;

  readonly MAX_DESCRIPCION_LENGTH = 1000; // Define el límite máximo de caracteres del campo descripcion
  caracteresRestantes = this.MAX_DESCRIPCION_LENGTH;
  

  constructor(
    private fb: FormBuilder,
    private pqrsService: PqrsService,
    public router: Router
  ) {
    this.pqrsForm = this.fb.group({
      idTema: ['', Validators.required],
      titulo: ['', Validators.required],
      descripcion: ['', [
        Validators.required,
        Validators.maxLength(this.MAX_DESCRIPCION_LENGTH)
      ]],
      prioridad: ['MEDIA', Validators.required]
    });

    // Suscribirse a los cambios en el campo descripción
    this.pqrsForm.get('descripcion')?.valueChanges.subscribe(value => {
      this.caracteresRestantes = this.MAX_DESCRIPCION_LENGTH - (value?.length || 0);
    });

  }

  ngOnInit() {
    this.cargarTemas();
  }

  cargarTemas() {
    this.pqrsService.listarTemas().subscribe({
      next: (data) => {
        this.temas = data;
      },
      error: (error) => {
        this.error = 'Error al cargar los temas';
        console.error('Error:', error);
      }
    });
  }

  // Métodos auxiliares
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return 'fa-file-image';
    } else if (fileType.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (fileType.includes('doc') || fileType.includes('word')) {
      return 'fa-file-word';
    }
    return 'fa-file';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.fileError = '';
    this.filePreview = null;
    
    if (file) {
      // Validar extensión
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!this.ALLOWED_FILE_TYPES.includes(fileExtension)) {
        this.fileError = `Tipo de archivo no permitido. Solo se permiten: ${this.ALLOWED_FILE_TYPES.join(', ')}`;
        this.archivoSeleccionado = null;
        return;
      }

      // Validar tamaño
      if (file.size > this.MAX_FILE_SIZE) {
        this.fileError = `El archivo excede el tamaño máximo permitido de ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`;
        this.archivoSeleccionado = null;
        return;
      }

      // Crear preview
      this.archivoSeleccionado = file;
      this.filePreview = {
        name: file.name,
        size: this.formatFileSize(file.size),
        type: file.type
      };

      // Si es una imagen, generar URL de preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (this.filePreview && e.target?.result) {
            this.filePreview.url = e.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeFile() {
    this.archivoSeleccionado = null;
    this.filePreview = null;
    this.fileError = '';
    this.uploadProgress = 0;
  }

  async onSubmit() {
    if (this.pqrsForm.valid) {
      this.isLoading = true;
      this.error = '';
      this.successMessage = '';
      // Resetear el progreso
      this.uploadProgress = 0;
  
      try {
        const formData = new FormData();
        
        formData.append('idTema', this.pqrsForm.get('idTema')?.value.toString());
        formData.append('titulo', this.pqrsForm.get('titulo')?.value);
        formData.append('descripcion', this.pqrsForm.get('descripcion')?.value);
        formData.append('prioridad', this.pqrsForm.get('prioridad')?.value);
  
        // Verificar explícitamente que el archivo existe
        const hasFile = this.archivoSeleccionado !== null;
        
        // Solo agregar el archivo si existe
        if (hasFile && this.archivoSeleccionado) {
          formData.append('archivo', this.archivoSeleccionado);
        }
  
        // Crear el observable base
        let request$ = this.pqrsService.crearPQRS(formData);
  
        // Solo aplicar el operador uploadProgress si hay archivo
        if (hasFile) {
          request$ = request$.pipe(
            uploadProgress(progress => {
              this.uploadProgress = progress;
            })
          );
        }
  
        // Aplicar el filtro de eventos HTTP y suscribirse
        request$.pipe(
          filter(event => event instanceof HttpResponse)
        ).subscribe({
          next: (response) => {
            if (response instanceof HttpResponse) {
              console.log('PQRS creada exitosamente:', response);
              this.successMessage = 'PQRS creada exitosamente';
              // Solo establecer el progreso al 100% si hay archivo
              if (hasFile) {
                this.uploadProgress = 100;
              }
              setTimeout(() => {
                this.router.navigate(['/pqrs']);
              }, 2000);
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.uploadProgress = 0;
            
            if (error.error?.error) {
              this.error = error.error.error;
            } else if (error.error?.mensaje) {
              this.error = error.error.mensaje;
            } else if (error.error?.message) {
              this.error = error.error.message;
            } else if (typeof error.error === 'string') {
              this.error = error.error;
            } else {
              this.error = 'Error al crear la PQRS';
            }
            
            console.log('Mensaje de error final:', this.error);
          },
          complete: () => {
            this.isLoading = false;
          }
        });
  
      } catch (error) {
        console.error('Error en submit:', error);
        this.error = 'Error al procesar la solicitud';
        this.isLoading = false;
        this.uploadProgress = 0;
      }
    } else {
      this.error = 'Por favor, complete todos los campos requeridos';
    }
  }

  // Método para convertir archivo a Base64
private convertirArchivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extraer solo la parte base64, eliminando el prefijo data:image/...
        resolve(reader.result.split(',')[1]);
      } else {
        reject('Error al convertir archivo');
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
}