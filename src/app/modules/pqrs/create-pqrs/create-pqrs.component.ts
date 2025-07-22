import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PqrsService } from '../../../core/services/pqrs.service';
import { PublicHeaderComponent } from '../../../shared/public-header/public-header.component';
import { PublicFooterComponent } from '../../../shared/public-footer/public-footer.component';

interface Tema {
  idTema: number;
  nombre: string;
  area: {
    nombre: string;
  };
}

@Component({
  selector: 'app-create-pqrs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './create-pqrs.component.html',
  styleUrls: ['./create-pqrs.component.css'],
  encapsulation: ViewEncapsulation.None  // IMPORTANTE: Esto hace que los estilos funcionen
})
export class CreatePqrsComponent implements OnInit {
  pqrsForm: FormGroup;
  temas: Tema[] = [];
  isLoading = false;
  error = '';
  archivoSeleccionado: File | null = null;
  showSuccessModal = false;
  successMessage = '';
  pqrsRadicado = '';
  tiposDocumento = ['CC', 'CE', 'PA', 'NIT'];
  prioridades = ['BAJA', 'MEDIA', 'ALTA'];
  showHelpModal = false;
  
  // Drag and drop state
  isDragging = false;
  
  constructor(
    private fb: FormBuilder,
    private pqrsService: PqrsService,
    public router: Router
  ) {
    this.pqrsForm = this.fb.group({
      idTema: ['', Validators.required],
      nombreSolicitante: ['', [Validators.required, Validators.minLength(2)]],
      emailSolicitante: ['', [Validators.required, Validators.email]],
      telefonoSolicitante: ['', [Validators.required, Validators.pattern(/^[0-9]{7,10}$/)]],
      tipoDocumentoSolicitante: ['CC', Validators.required],
      numeroDocumentoSolicitante: ['', [Validators.required, Validators.minLength(6)]],
      titulo: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
      prioridad: ['MEDIA', Validators.required]
    });
  }

  ngOnInit() {
    console.log('CreatePqrsComponent initialized');
    this.cargarTemas();
    this.setupFormValidation();
  }

  private setupFormValidation() {
    // Escuchar cambios en el formulario para limpiar errores
    this.pqrsForm.valueChanges.subscribe(() => {
      if (this.error) {
        this.error = '';
      }
    });
  }

  cargarTemas() {
    this.pqrsService.listarTemas().subscribe({
      next: (data) => {
        this.temas = data;
      },
      error: (error) => {
        this.error = 'Error al cargar los temas disponibles. Por favor, recargue la página.';
        console.error('Error:', error);
      }
    });
  }

  // Manejo de archivos mejorado
  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.handleFile(file);
  }

  // Drag and drop functionality
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File | undefined) {
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      this.error = 'Tipo de archivo no permitido. Solo se aceptan archivos PDF, DOC, DOCX, JPG y PNG.';
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      this.error = 'El archivo es demasiado grande. El tamaño máximo permitido es de 5MB.';
      return;
    }

    this.archivoSeleccionado = file;
    this.error = ''; // Limpiar errores previos
  }

  removeFile() {
    this.archivoSeleccionado = null;
    // Limpiar el input file
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async onSubmit() {
    if (this.pqrsForm.invalid) {
      this.markFormAsTouched();
      this.error = 'Por favor, complete todos los campos requeridos correctamente.';
      this.scrollToFirstError();
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      let formData = { ...this.pqrsForm.value };

      // Procesar archivo adjunto si existe - SIN nombreArchivo y tipoArchivo
      if (this.archivoSeleccionado) {
        const base64 = await this.convertirArchivoABase64(this.archivoSeleccionado);
        formData = { 
          ...formData, 
          archivoAdjunto: base64
          // Removemos nombreArchivo y tipoArchivo que causan el error
        };
      }

      this.pqrsService.crearPQRSPublica(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.handleSuccess(response);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.error = 'Error al procesar el archivo adjunto. Por favor, intente nuevamente.';
    }
  }

  private handleSuccess(response: any) {
    // Debug: Ver qué devuelve el backend
    console.log('=== RESPUESTA DEL BACKEND AL CREAR PQRS ===');
    console.log('Respuesta completa:', response);
    console.log('Radicado del backend (numeroRadicado):', response?.numeroRadicado);
    console.log('Tipo de radicado:', typeof response?.numeroRadicado);
    console.log('Token/UUID opciones:', {
      tokenUuid: response?.tokenUuid,
      token: response?.token,
      uuid: response?.uuid,
      tokenConsulta: response?.tokenConsulta,
      tokenPublico: response?.tokenPublico
    });
    console.log('Todas las propiedades:', Object.keys(response || {}));
    
    // Extraer información de la respuesta con logs detallados
    const radicadoBackend = response?.numeroRadicado;
    if (radicadoBackend) {
      console.log('✅ Usando radicado del backend:', radicadoBackend);
      this.pqrsRadicado = radicadoBackend;
    } else {
      console.log('❌ Backend no devolvió radicado, generando uno temporal');
      this.pqrsRadicado = this.generateRadicado();
      console.log('📝 Radicado temporal generado:', this.pqrsRadicado);
    }
    
    console.log('🎯 Radicado final que se mostrará en modal:', this.pqrsRadicado);
    const tokenConsulta = response?.tokenUuid || response?.token || response?.uuid || response?.tokenConsulta || response?.tokenPublico;
    
    if (tokenConsulta && this.pqrsRadicado) {
      const urlConsulta = `/consulta-pqrs/${this.pqrsRadicado}/${tokenConsulta}`;
      console.log('✅ URL de consulta generada:', urlConsulta);
      console.log('✅ URL completa:', window.location.origin + urlConsulta);
    } else {
      console.log('❌ No se pudo generar URL de consulta');
      console.log('❌ Radicado:', this.pqrsRadicado);
      console.log('❌ Token:', tokenConsulta);
    }
    
    this.successMessage = '¡Solicitud creada exitosamente!';
    this.showSuccessModal = true;
    
    // Limpiar el formulario
    this.resetForm();
    
    // Scroll al top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private handleError(error: any) {
    console.error('Error al crear Solicitud:', error);
    
    if (error.status === 400) {
      this.error = 'Los datos proporcionados no son válidos. Por favor, revise la información.';
    } else if (error.status === 413) {
      this.error = 'El archivo adjunto es demasiado grande.';
    } else if (error.status === 0) {
      this.error = 'Error de conexión. Por favor, verifique su conexión a internet.';
    } else {
      this.error = 'Error al crear la Solicitud. Por favor, intente nuevamente.';
    }
    
    this.scrollToTop();
  }

  private generateRadicado(): string {
    // Generar un número de radicado temporal si no viene en la respuesta
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AMIRL-${year}-${random}`;
  }

  private resetForm() {
    this.pqrsForm.reset();
    this.pqrsForm.patchValue({
      tipoDocumentoSolicitante: 'CC',
      prioridad: 'MEDIA'
    });
    this.archivoSeleccionado = null;
    
    // Limpiar el input file
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private convertirArchivoABase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remover el prefijo data:type;base64,
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject('Error al convertir archivo a Base64');
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }

  private markFormAsTouched() {
    Object.keys(this.pqrsForm.controls).forEach(key => {
      const control = this.pqrsForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private scrollToFirstError() {
    const firstErrorElement = document.querySelector('.form-input.error, .form-select.error, .form-textarea.error');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Métodos de navegación
  volver() {
    if (this.pqrsForm.dirty) {
      if (confirm('¿Está seguro de que desea salir? Los cambios no guardados se perderán.')) {
        this.router.navigate(['/']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.successMessage = '';
    this.pqrsRadicado = '';
    // Navegar al inicio después de cerrar el modal
    this.router.navigate(['/']);
  }

  // Validadores personalizados
  getFieldError(fieldName: string): string {
    const field = this.pqrsForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return this.getRequiredMessage(fieldName);
      }
      if (field.errors['email']) {
        return 'Ingrese un correo electrónico válido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['pattern']) {
        return this.getPatternMessage(fieldName);
      }
    }
    return '';
  }

  private getRequiredMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      nombreSolicitante: 'El nombre completo es requerido',
      emailSolicitante: 'El correo electrónico es requerido',
      telefonoSolicitante: 'El teléfono es requerido',
      numeroDocumentoSolicitante: 'El número de documento es requerido',
      idTema: 'Debe seleccionar un tema',
      titulo: 'El título es requerido',
      descripcion: 'La descripción es requerida'
    };
    return messages[fieldName] || 'Este campo es requerido';
  }

  private getPatternMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      telefonoSolicitante: 'Ingrese un número de teléfono válido (7-10 dígitos)'
    };
    return messages[fieldName] || 'Formato inválido';
  }

  // Utilidades para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.pqrsForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getCharacterCount(fieldName: string): number {
    const field = this.pqrsForm.get(fieldName);
    return field?.value?.length || 0;
  }

  // Método para mostrar/ocultar modal de ayuda
  toggleHelpModal() {
    this.showHelpModal = !this.showHelpModal;
  }

  closeHelpModal() {
    this.showHelpModal = false;
  }
}