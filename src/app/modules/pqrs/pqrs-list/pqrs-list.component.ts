// pqrs-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PqrsService } from '../../../core/services/pqrs.service';
import { UserService } from '../../../core/services/user.service';
import { AreaService } from '../../../core/services/area.service';

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

interface AsignacionPQRS {
  usuario: {
    idUsuario: number;
    nombreCompleto: string;
  };
  pqrsAsignados: any[];
}

@Component({
  selector: 'app-pqrs-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pqrs-list.component.html',
  styleUrls: ['./pqrs-list.component.css']
})
export class PqrsListComponent implements OnInit {
  pqrsList: PQRS[] = [];
  asignaciones: AsignacionPQRS[] = [];
  filtroEstado: string = '';
  estados: string[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
  isLoading: boolean = false;
  error: string = '';
  modalError: string = ''; 
  selectedPqrs: number | null = null;
  asignacionForm: FormGroup;
  usuariosFiltrados: any[] = []; // Aquí almacenaremos los usuarios disponibles+
  // En la clase del componente
  showConfirmModal = false;
  successMessage = '';
  areas: any[] = [];

  // Propiedades de paginación
  currentPage: number = 0;
  pageSize: number = 15;
  totalElements: number = 0;
  totalPages: number = 0;
  pageSizeOptions: number[] = [5, 10, 15, 20, 50];
  sortField: string = 'idPqrs';
  sortDirection: string = 'desc';
  
  // Filtros adicionales
  filtroPrioridad: string = '';
  searchTerm: string = '';
  prioridades: string[] = ['ALTA', 'MEDIA', 'BAJA'];

  constructor(
    private pqrsService: PqrsService,
    private areaService: AreaService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.asignacionForm = this.fb.group({
      area: ['', Validators.required],  // Inicializar vacío
      usuario: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.cargarPQRS();
    this.cargarAreas();
    // Eliminado cargarPQRSSinAsignar() - usar solo paginación backend
  }

  cargarAreas() {
    this.areaService.listarAreas().subscribe({
      next: (data) => {
        this.areas = data;
        console.log('Áreas cargadas:', this.areas);
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
        this.error = 'Error al cargar las áreas';
      }
    });
  }

  cargarPQRSSinAsignar() {
    this.isLoading = true;
    this.pqrsService.listarPQRSSinAsignar().subscribe({
      next: (data) => {
        this.pqrsList = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las Solicitudes sin asignar';
        this.isLoading = false;
        console.error('Error:', error);
      }
    });
  }

  // Cargar PQRS con paginación backend
  cargarPQRS() {
    this.isLoading = true;
    this.error = '';

    // SOLUCIÓN TEMPORAL: Eliminar parámetro sort para evitar error SQL "order by list must be unique"
    // const sort = `${this.sortField},${this.sortDirection}`;
    
    // Construir filtros
    const filtros = {
      estado: this.filtroEstado || undefined,
      prioridad: this.filtroPrioridad || undefined,
      search: this.searchTerm || undefined
    };

    console.log('Cargando Solicitudes con parámetros (SIN SORT para evitar error SQL):', {
      page: this.currentPage,
      size: this.pageSize,
      // sort: 'DESHABILITADO por error SQL backend',
      filtros
    });

    // Llamar sin parámetro sort para evitar error SQL del backend
    this.pqrsService.listarPQRSPaginado(this.currentPage, this.pageSize, undefined, filtros).subscribe({
      next: (response) => {
        console.log('Respuesta paginada recibida:', response);
        
        if (response && response.content && Array.isArray(response.content)) {
          this.pqrsList = response.content;
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          
          console.log('Datos de paginación actualizados:', {
            currentPage: this.currentPage,
            totalElements: this.totalElements,
            totalPages: this.totalPages,
            itemsInPage: this.pqrsList.length
          });
        } else {
          console.error('Respuesta no válida:', response);
          this.error = 'Error en el formato de datos';
          this.pqrsList = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar Solicitudes paginadas:', error);
        this.error = error.message || 'Error al cargar las Solicitudes';
        this.pqrsList = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.isLoading = false;
      }
    });
  }

  // Manejo de cambios de filtros
  onFiltroChange() {
    this.currentPage = 0; // Resetear a la primera página
    this.cargarPQRS();
  }

  onFiltroPrioridadChange() {
    this.currentPage = 0;
    this.cargarPQRS();
  }

  onSearchChange() {
    this.currentPage = 0;
    this.cargarPQRS();
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.searchTerm = '';
    this.currentPage = 0;
    this.cargarPQRS();
  }

  // Métodos de paginación
  onPageChange(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.cargarPQRS();
    }
  }

  onPageSizeChange() {
    this.currentPage = 0; // Resetear a la primera página
    this.cargarPQRS();
  }

  // Métodos de ordenamiento
  onSort(field: string) {
    if (this.sortField === field) {
      // Cambiar dirección si es el mismo campo
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nuevo campo, empezar con descendente
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.currentPage = 0;
    this.cargarPQRS();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fas fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  // Utilidades de paginación
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible);
    
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStartIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad.toUpperCase()) {
      case 'ALTA': return 'prioridad-alta';
      case 'MEDIA': return 'prioridad-media';
      case 'BAJA': return 'prioridad-baja';
      default: return '';
    }
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

  openAsignacionModal(pqrs: PQRS) {
    this.selectedPqrs = pqrs.idPqrs;
    this.error = '';
    this.successMessage = '';
    
    // Resetear el formulario completamente
    this.asignacionForm.reset({
      area: '',
      usuario: '',
      motivo: ''
    });
    
    this.usuariosFiltrados = [];
  
    if (pqrs.usuarioAsignado) {
      // Lógica para usuario asignado...
      this.userService.getUserDetailById(pqrs.usuarioAsignado.idUsuario).subscribe({
        next: (infoUsuario) => {
          this.asignacionForm.patchValue({
            area: infoUsuario.idArea
          });
          
          this.userService.getUsuariosPorArea(infoUsuario.idArea).subscribe({
            next: (usuarios) => {
              this.usuariosFiltrados = usuarios;
              this.asignacionForm.patchValue({
                usuario: pqrs.usuarioAsignado?.idUsuario
              });
            },
            error: (error) => {
              console.error('Error al cargar usuarios:', error);
              this.error = 'Error al cargar usuarios del área';
            }
          });
        },
        error: (error) => {
          console.error('Error al obtener información del usuario:', error);
          this.error = 'Error al obtener información del usuario';
        }
      });
    } else {
      // Mostrar la opción "Seleccione un área" por defecto
      this.asignacionForm.patchValue({
        area: ''
      });
    }
  }

  cerrarModal() {
    this.selectedPqrs = null;
    this.asignacionForm.reset();
    this.usuariosFiltrados = [];
    this.modalError = ''; // Limpiar el error de la modal
  }

  async onSubmitAsignacion() {
    if (this.asignacionForm.valid && this.selectedPqrs) {
      const nuevoUsuarioId = this.asignacionForm.get('usuario')?.value;
      
      const pqrsActual = this.pqrsList.find(p => p.idPqrs === this.selectedPqrs);
      
      if (pqrsActual?.usuarioAsignado?.idUsuario === nuevoUsuarioId) {
        this.modalError = 'El usuario seleccionado ya está asignado a esta Solicitud';
        return;
      }
  
      this.isLoading = true;
      this.modalError = '';
      this.successMessage = '';
      
      try {
        await this.pqrsService.asignarPQRS(
          this.selectedPqrs,
          {
            idUsuarioNuevo: nuevoUsuarioId,
            motivoCambio: this.asignacionForm.get('motivo')?.value
          }
        ).toPromise();
  
        this.successMessage = 'Asignación realizada exitosamente';
        await this.cargarPQRS();
        
        this.asignacionForm.disable();
        
        setTimeout(() => {
          this.cerrarModal();
          this.asignacionForm.enable();
        }, 2000);
  
      } catch (error) {
        console.error('Error al asignar Solicitud:', error);
        this.modalError = 'Error al realizar la asignación';
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Añadir este método para manejar el cambio de usuario
  onUsuarioChange() {
    const nuevoUsuarioId = this.asignacionForm.get('usuario')?.value;
    const pqrsActual = this.pqrsList.find(p => p.idPqrs === this.selectedPqrs);
    
    if (pqrsActual?.usuarioAsignado?.idUsuario === nuevoUsuarioId) {
      this.modalError = 'El usuario seleccionado ya está asignado a esta Solicitud';
      this.asignacionForm.get('usuario')?.setErrors({ 'usuarioRepetido': true });
    } else {
      this.modalError = '';
      const usuarioErrors = this.asignacionForm.get('usuario')?.errors;
      if (usuarioErrors) {
        delete usuarioErrors['usuarioRepetido'];
        this.asignacionForm.get('usuario')?.setErrors(
          Object.keys(usuarioErrors).length === 0 ? null : usuarioErrors
        );
      }
    }
  }

  async cargarAsignaciones() {
    try {
      this.isLoading = true;
      const pqrsList = await this.pqrsService.listarPQRS().toPromise();
      
      if (pqrsList) {
        this.asignaciones = this.agruparPqrsPorUsuario(pqrsList);
      } else {
        this.asignaciones = [];
      }
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      this.error = 'Error al cargar asignaciones';
      this.asignaciones = [];
    } finally {
      this.isLoading = false;
    }
  }

  agruparPqrsPorUsuario(pqrsList: any[]) {
    const agrupados = new Map();
    
    // Crear un grupo para PQRS sin asignar
    agrupados.set('sin_asignar', {
      usuario: { nombreCompleto: 'Sin Asignar' },
      pqrsAsignados: []
    });
  
    pqrsList.forEach(pqrs => {
      if (pqrs.usuarioAsignado) {
        const userId = pqrs.usuarioAsignado.idUsuario;
        if (!agrupados.has(userId)) {
          agrupados.set(userId, {
            usuario: pqrs.usuarioAsignado,
            pqrsAsignados: []
          });
        }
        agrupados.get(userId).pqrsAsignados.push(pqrs);
      } else {
        agrupados.get('sin_asignar').pqrsAsignados.push(pqrs);
      }
    });
  
    return Array.from(agrupados.values());
  }

  onAreaChange() {
    const areaId = this.asignacionForm.get('area')?.value;
    
    // Limpiar usuarios filtrados y el usuario seleccionado si no hay área
    if (!areaId) {
      this.usuariosFiltrados = [];
      this.asignacionForm.patchValue({ usuario: '' });
      return;
    }
  
    this.isLoading = true;
    this.userService.getUsuariosPorArea(areaId).subscribe({
      next: (usuarios) => {
        this.usuariosFiltrados = usuarios;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.error = 'Error al cargar los usuarios del área';
        this.isLoading = false;
        this.usuariosFiltrados = [];
      }
    });
  }


}