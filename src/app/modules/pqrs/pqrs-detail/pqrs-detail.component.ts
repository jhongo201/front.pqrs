// pqrs-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PqrsService } from '../../../core/services/pqrs.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { uploadProgress } from '../../../shared/operators/upload-progress.operator';
import { filter } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { HistorialAsignacion } from '../../../core/interfaces/historial-asignacion.interface';

interface PQRS {
  idPqrs: number;
  nombreSolicitante: string;
  emailSolicitante: string;
  telefonoSolicitante: string;
  tipoDocumentoSolicitante: string;
  numeroDocumentoSolicitante: string;
  numeroRadicado?: string; // Para cuando viene como numeroRadicado
  tema: {
    idTema: number;
    nombre: string;
    descripcion: string;
    estado: boolean;
    area: {
      idArea: number;
      nombre: string;
    }
  };
  titulo: string;
  descripcion: string;
  prioridad: string;
  estadoPqrs: string;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
  seguimientos: Array<{
    idSeguimiento: number;
    usuario: {
      idUsuario: number;
      username: string;
      nombreCompleto: string;
      email: string;
    };
    comentario: string;
    archivoAdjunto?: string;
    esRespuestaFinal: boolean;
    fechaCreacion: string;
    tipoSeguimiento: string;
  }>;
  usuarioAsignado?: {
    idUsuario: number;
    nombreCompleto: string;
    username: string;
  };

}

interface FilePreview {
  name: string;
  size: string;
  type: string;
  url?: string;
}

interface Respuesta {
  comentario: string;
  fechaCreacion: string;
  archivoAdjunto?: string;
  usuario?: {
    nombreCompleto: string;
  };
}


@Component({
  selector: 'app-pqrs-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pqrs-detail.component.html',
  styleUrls: ['./pqrs-detail.component.css']
})
export class PqrsDetailComponent implements OnInit {
  pqrs: PQRS | null = null;
  isLoading = false;
  error = '';
  seguimientoForm: FormGroup;
  showSeguimientoForm = false;
  archivoSeleccionado: File | null = null;
  estados = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
  prioridades = ['ALTA', 'MEDIA', 'BAJA'];
  baseUrl = 'http://localhost:8080/api/files/';

  // Constantes para controlar el tipo de archivos y su peso
  readonly ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg'];
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes
  fileError: string = '';

  //Vista previa y barra de progreso
  filePreview: FilePreview | null = null;
  uploadProgress: number = 0;

  isUsuarioRegistrado = true; // Esto deberías obtenerlo de tu servicio de autenticación
  tokenUuid?: string; // Para usuarios no registrados
  showRespuestaForm = false;
  respuestaForm: FormGroup;
  
  historialAsignaciones: HistorialAsignacion[] = [];
  isHistorialExpanded = false;

  // Atributos para paginación
  pageSize = 5; // Cantidad de items por página
  currentPage = 0; // Página actual
  seguimientosPaginados: Array<any> = [];
  hasMoreSeguimientos = true;

  // Propiedades para control de roles
  isUsuarioRole = false;
  userRole: string = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private pqrsService: PqrsService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.seguimientoForm = this.fb.group({
      comentario: ['', Validators.required],
      esRespuestaFinal: [false]
    });

    // Inicialización del formulario de respuesta
    this.respuestaForm = this.fb.group({
      comentario: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Detectar el rol del usuario
    this.detectarRolUsuario();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.cargarPQRS(params['id']);
        this.cargarHistorialAsignaciones(params['id']);
      }
      // Agregar verificación de token para usuarios no registrados
      if (params['tokenUuid']) {
        this.tokenUuid = params['tokenUuid'];
        this.isUsuarioRegistrado = false;
      }
    });
  }

  cargarPQRS(id: number) {
    this.isLoading = true;
    this.pqrsService.obtenerPQRS(id).subscribe({
      next: (data) => {
        if (data && Array.isArray(data.seguimientos)) {
          // Ordenar los seguimientos
          const seguimientosOrdenados = [...data.seguimientos].sort((a, b) => 
            new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
          );
          
          // Asignar los datos con los seguimientos ordenados
          this.pqrs = {
            ...data,
            seguimientos: seguimientosOrdenados
          };
        } else {
          // Si no hay seguimientos, asignar los datos sin modificar
          this.pqrs = data;
        }
        
        // Iniciar la paginación
        this.cargarSiguientePagina();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar la Solicitud';
        this.isLoading = false;
        console.error('Error:', error);
      }
    });
  }

  cargarSiguientePagina() {
    if (!this.pqrs?.seguimientos) {
      this.hasMoreSeguimientos = false;
      return;
    }
  
    // Filtrar los seguimientos excluyendo los adjuntos iniciales
    const seguimientosFiltrados = this.pqrs.seguimientos.filter(s => s.tipoSeguimiento !== 'ADJUNTO_INICIAL');
    
    
    const inicio = this.currentPage * this.pageSize;
    const fin = inicio + this.pageSize;
    
    const nuevosSeguimientos = seguimientosFiltrados.slice(inicio, fin);
    
    // Agregar nuevos seguimientos al array paginado
    this.seguimientosPaginados = [...this.seguimientosPaginados, ...nuevosSeguimientos];
    
    // Verificar si hay más seguimientos para cargar
    this.hasMoreSeguimientos = fin < seguimientosFiltrados.length;
    
    // Incrementar página actual
    this.currentPage++;
  }

  resetPaginacion() {
    this.currentPage = 0;
    this.seguimientosPaginados = [];
    this.hasMoreSeguimientos = Boolean(this.pqrs?.seguimientos?.length);
  }


  // Método para manejar el cambio de archivo
  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.fileError = '';
    this.filePreview = null;
    this.uploadProgress = 0;
    
    if (file) {
      // Validar tipo de archivo
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!this.ALLOWED_FILE_TYPES.includes(fileExtension)) {
        this.fileError = `Tipo de archivo no permitido. Solo se permiten: ${this.ALLOWED_FILE_TYPES.join(', ')}`;
        this.archivoSeleccionado = null;
        (event.target as HTMLInputElement).value = '';
        return;
      }

      // Validar tamaño
      if (file.size > this.MAX_FILE_SIZE) {
        this.fileError = `El archivo excede el tamaño máximo permitido de ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`;
        this.archivoSeleccionado = null;
        (event.target as HTMLInputElement).value = '';
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

  // Método para formatear el tamaño del archivo
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Método para remover el archivo seleccionado
  removeFile() {
    this.archivoSeleccionado = null;
    this.filePreview = null;
    this.fileError = '';
    this.uploadProgress = 0;
  }

  getFileUrl(archivoAdjunto: string): string {
    if (archivoAdjunto) {
      return `http://localhost:8080/api/files/${archivoAdjunto}`;
    }
    return '';
  }

  // Método para agregar seguimiento con barra de progreso
  async agregarSeguimiento() {
    if (!this.seguimientoForm.valid || (this.fileError && this.archivoSeleccionado)) {
      return;
    }
  
    this.isLoading = true;
    const formData = new FormData();
    formData.append('comentario', this.seguimientoForm.get('comentario')?.value);
    formData.append('esRespuestaFinal', this.seguimientoForm.get('esRespuestaFinal')?.value);
  
    if (this.archivoSeleccionado) {
      formData.append('archivo', this.archivoSeleccionado);
    }
  
    console.log('FormData a enviar:', {
      comentario: this.seguimientoForm.get('comentario')?.value,
      esRespuestaFinal: this.seguimientoForm.get('esRespuestaFinal')?.value,
      tieneArchivo: !!this.archivoSeleccionado
    });
  
    this.pqrsService.agregarSeguimiento(this.pqrs!.idPqrs, formData).pipe(
      uploadProgress(progress => {
        this.uploadProgress = progress;
      }),
      filter(event => event instanceof HttpResponse)
    ).subscribe({
      next: (response) => {
        if (response instanceof HttpResponse) {
          console.log('Respuesta exitosa:', response);
          this.resetPaginacion();
          this.cargarPQRS(this.pqrs!.idPqrs);
          this.resetForm();
        }
      },
      error: (error) => {
        console.error('Error completo:', error);
        this.error = error.error?.mensaje || error.error?.error || 'Error al agregar el seguimiento';
        this.isLoading = false;
      }
    });
  }

  // Método para resetear el formulario
  private resetForm() {
    this.seguimientoForm.reset();
    this.showSeguimientoForm = false;
    this.archivoSeleccionado = null;
    this.filePreview = null;
    this.fileError = '';
    this.uploadProgress = 0;
    this.isLoading = false;
  }

  // Tipado del evento
  cambiarEstado(evento: Event) {
    const select = evento.target as HTMLSelectElement;
    if (!this.pqrs) return;

    this.isLoading = true;
    this.pqrsService.actualizarEstado(this.pqrs.idPqrs, select.value).subscribe({
      next: () => {
        this.cargarPQRS(this.pqrs!.idPqrs);
      },
      error: (error) => {
        this.error = 'Error al actualizar el estado';
        this.isLoading = false;
        console.error('Error:', error);
      }
    });
  }

  cambiarPrioridad(evento: Event) {
    const select = evento.target as HTMLSelectElement;
    if (!this.pqrs) return;

    this.isLoading = true;
    this.pqrsService.actualizarPrioridad(this.pqrs.idPqrs, select.value).subscribe({
      next: () => {
        this.cargarPQRS(this.pqrs!.idPqrs);
      },
      error: (error) => {
        this.error = 'Error al actualizar la prioridad';
        this.isLoading = false;
        console.error('Error:', error);
      }
    });
  }

  // Método para enviar respuesta
// En el componente
async enviarRespuesta() {
  if (!this.respuestaForm.valid || (this.fileError && this.archivoSeleccionado)) {
      return;
  }

  this.isLoading = true;
  const formData = new FormData();
  formData.append('comentario', this.respuestaForm.get('comentario')?.value);

  if (this.archivoSeleccionado) {
      formData.append('archivoAdjunto', this.archivoSeleccionado);
  }

  this.pqrsService.responderComoUsuarioRegistrado(this.pqrs!.idPqrs, formData).pipe(
      uploadProgress(progress => {
          this.uploadProgress = progress;
      }),
      filter(event => event instanceof HttpResponse)
  ).subscribe({
      next: (response) => {
          if (response instanceof HttpResponse) {
              this.cargarPQRS(this.pqrs!.idPqrs);
              this.resetRespuestaForm();
          }
      },
      error: (error) => {
          console.error('Error detallado:', error);
          this.error = `Error al enviar la respuesta: ${error.error?.error || error.message || 'Error desconocido'}`;
          this.isLoading = false;
      }
  });
}

  // Método para resetear el formulario de respuesta
  private resetRespuestaForm() {
    this.respuestaForm.reset();
    this.showRespuestaForm = false;
    this.archivoSeleccionado = null;
    this.filePreview = null;
    this.fileError = '';
    this.uploadProgress = 0;
    this.isLoading = false;
  }

  

  private convertirArchivoABase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject('Error al convertir archivo');
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'EN_PROCESO': return 'estado-proceso';
      case 'RESUELTO': return 'estado-resuelto';
      case 'CERRADO': return 'estado-cerrado';
      default: return '';
    }
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad.toUpperCase()) {
      case 'ALTA': return 'prioridad-alta';
      case 'MEDIA': return 'prioridad-media';
      case 'BAJA': return 'prioridad-baja';
      default: return '';
    }
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return 'fa-file-image';
    } else if (fileType.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (fileType.includes('doc') || fileType.includes('word')) {
      return 'fa-file-word';
    } else {
      return 'fa-file';
    }
  }

  // Método auxiliar para navegar
  volver() {
    this.router.navigate(['/pqrs']);
  }

  // Métodos para controlar la visibilidad de los formularios
  toggleSeguimientoForm() {
    this.showSeguimientoForm = !this.showSeguimientoForm;
    if (this.showSeguimientoForm) {
      this.showRespuestaForm = false; // Cerrar el otro formulario
      this.resetRespuestaForm();
    }
  }

  toggleRespuestaForm() {
    this.showRespuestaForm = !this.showRespuestaForm;
    if (this.showRespuestaForm) {
      this.showSeguimientoForm = false; // Cerrar el otro formulario
      this.resetForm();
    }
  }

  toggleHistorial() {
    this.isHistorialExpanded = !this.isHistorialExpanded;
  }

  cargarHistorialAsignaciones(idPqrs: number) {
    if (!idPqrs) {
      console.error('ID de Solicitud no válido');
      return;
    }
    
    console.log('Cargando historial para Solicitud:', idPqrs);
    this.pqrsService.obtenerHistorialAsignaciones(idPqrs).subscribe({
      next: (historial) => {
        console.log('Historial recibido:', historial);
        this.historialAsignaciones = historial || [];
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.error = error.message || 'Error al cargar el historial de asignaciones';
        this.historialAsignaciones = []; // Inicializar como array vacío en caso de error
      }
    });
  }

  // Método para verificar si hay adjuntos iniciales
  tieneAdjuntosIniciales(): boolean {
    return this.pqrs?.seguimientos?.some(s => s.tipoSeguimiento === 'ADJUNTO_INICIAL') || false;
  }

  // Método para obtener los adjuntos iniciales
  getAdjuntosIniciales(): any[] {
    return this.pqrs?.seguimientos?.filter(s => s.tipoSeguimiento === 'ADJUNTO_INICIAL') || [];
  }

  // Método para filtrar seguimientos sin adjuntos iniciales
  filtrarSeguimientosSinAdjuntosIniciales(seguimientos: any[]): any[] {
    return seguimientos.filter(s => s.tipoSeguimiento !== 'ADJUNTO_INICIAL');
  }

  contarSeguimientosSinIniciales(): number {
    return this.pqrs?.seguimientos?.filter(s => s.tipoSeguimiento !== 'ADJUNTO_INICIAL').length || 0;
  }

  // Método para detectar el rol del usuario
  detectarRolUsuario(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.rol) {
      // El rol puede ser string o objeto
      this.userRole = typeof currentUser.rol === 'string' 
        ? currentUser.rol 
        : currentUser.rol.nombre;
      this.isUsuarioRole = this.userRole === 'USUARIO';
      console.log('PqrsDetail - Rol detectado:', this.userRole, 'Es USUARIO:', this.isUsuarioRole);
    } else {
      console.warn('PqrsDetail - No se pudo detectar el rol del usuario');
    }
  }

}