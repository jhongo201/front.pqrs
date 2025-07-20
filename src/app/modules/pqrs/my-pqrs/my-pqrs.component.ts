// my-pqrs.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PqrsService } from '../../../core/services/pqrs.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface PQRS {
  idPqrs: number;
  numeroRadicado: string;
  titulo: string;
  nombreSolicitante: string;
  emailSolicitante: string;
  tema: {
    idTema: number;
    nombre: string;
    area: {
      idArea: number;
      nombre: string;
    }
  };
  estadoPqrs: string;
  prioridad: string;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
  [key: string]: any;
}

@Component({
  selector: 'app-my-pqrs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-pqrs.component.html',
  styleUrls: ['./my-pqrs.component.css']
})
export class MyPqrsComponent implements OnInit, OnDestroy {
  pqrsList: PQRS[] = [];
  filteredPqrsList: PQRS[] = [];
  filtroEstado: string = '';
  filtroPrioridad: string = '';
  searchTerm: string = '';
  
  estados: string[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
  prioridades: string[] = ['ALTA', 'MEDIA', 'BAJA'];
  
  isLoading: boolean = false;
  error: string = '';
  
  // Propiedades de paginación
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  isFirst: boolean = true;
  isLast: boolean = true;
  
  // Opciones de tamaño de página
  pageSizeOptions: number[] = [5, 10, 15, 20];
  
  // Para usar Math en el template
  Math = Math;
  
  refreshInterval: any;
  private destroy$ = new Subject<void>();

  // Propiedades para control de rol
  isUsuarioRole: boolean = false;
  userRole: string = '';

  constructor(private pqrsService: PqrsService, private authService: AuthService) {}

  ngOnInit() {
    this.detectarRolUsuario();
    this.cargarMisPQRS();
    // Actualizar cada 5 minutos
    this.refreshInterval = setInterval(() => {
      this.cargarMisPQRS(false);
    }, 300000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarMisPQRS(showLoading: boolean = true) {
    if (showLoading) this.isLoading = true;
    
    // Construir parámetros de ordenamiento según documentación del backend
    const sort = 'fechaCreacion,desc'; // Ordenar por fecha descendente por defecto
    
    // Construir filtros para enviar al backend
    console.log('=== CONSTRUYENDO FILTROS ===');
    console.log('Estado actual de las propiedades:', {
      filtroEstado: this.filtroEstado,
      filtroPrioridad: this.filtroPrioridad,
      searchTerm: this.searchTerm
    });
    
    const filtros = {
      estado: this.filtroEstado || undefined,
      prioridad: this.filtroPrioridad || undefined,
      search: this.searchTerm || undefined
    };
    
    console.log('Objeto filtros construido:', filtros);
    console.log('Cargando PQRS - Página:', this.currentPage, 'Tamaño:', this.pageSize);
    
    // Llamar al servicio con paginación y filtros
    this.pqrsService.listarMisPQRSPaginado(
      this.currentPage,
      this.pageSize,
      sort, // Enviar parámetro de ordenamiento según documentación
      filtros
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('=== RESPUESTA EXITOSA DEL BACKEND ===');
          console.log('Respuesta paginada del backend:', response);
          
          // Manejar respuesta paginada (objeto Page)
          if (response && response.content) {
            this.pqrsList = response.content;
            this.filteredPqrsList = response.content; // Los datos ya vienen filtrados del backend
            this.totalElements = response.totalElements || 0;
            this.totalPages = response.totalPages || 0;
            this.isFirst = response.first !== undefined ? response.first : true;
            this.isLast = response.last !== undefined ? response.last : true;
            
            console.log('Datos procesados:', {
              total: this.totalElements,
              pages: this.totalPages,
              current: this.currentPage,
              size: this.pageSize,
              items: this.filteredPqrsList.length
            });
          } else {
            console.warn('Respuesta sin estructura Page esperada:', response);
            this.pqrsList = [];
            this.filteredPqrsList = [];
            this.totalElements = 0;
            this.totalPages = 0;
          }
          
          this.isLoading = false;
          this.error = '';
          
          console.log('Estado final de paginación:', {
            currentPage: this.currentPage,
            totalElements: this.totalElements,
            totalPages: this.totalPages,
            isFirst: this.isFirst,
            isLast: this.isLast,
            items: this.filteredPqrsList.length
          });
        },
        error: (error) => {
          console.error('=== ERROR AL CARGAR PQRS ===');
          console.error('Error al cargar PQRS:', error);
          
          // Si hay filtros y falla, intentar sin filtros como respaldo
          const hayFiltros = this.filtroEstado || this.filtroPrioridad || this.searchTerm;
          if (hayFiltros && error.status === 400) {
            console.warn('Intentando cargar sin filtros como respaldo...');
            this.cargarSinFiltros();
          } else {
            this.isLoading = false;
            this.error = 'Error al cargar los PQRS asignados';
            
            // Manejo de errores específicos
            if (error.status === 400) {
              this.error = 'Error en los parámetros de consulta. Verifica que la ruta /pqrs/mis-pqrs tenga permisos en la base de datos.';
            } else if (error.status === 403) {
              this.error = 'No tienes permisos para acceder a esta funcionalidad. Verifica que la ruta /pqrs/mis-pqrs esté registrada en la base de datos.';
            }
          }
        }
      });
  }

  // Método de respaldo para cargar sin filtros
  cargarSinFiltros() {
    console.log('=== CARGANDO SIN FILTROS (RESPALDO) ===');
    this.pqrsService.listarMisPQRSPaginado(this.currentPage, this.pageSize, 'fechaCreacion,desc')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Respuesta sin filtros:', response);
          if (response && response.content) {
            this.pqrsList = response.content;
            this.filteredPqrsList = response.content;
            this.totalElements = response.totalElements || 0;
            this.totalPages = response.totalPages || 0;
            this.isFirst = response.first !== undefined ? response.first : true;
            this.isLast = response.last !== undefined ? response.last : true;
          }
          this.isLoading = false;
          this.error = '';
        },
        error: (error) => {
          console.error('Error incluso sin filtros:', error);
          this.isLoading = false;
          this.error = 'Error al cargar los PQRS. Contacta al administrador.';
        }
      });
  }

  detectarRolUsuario(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.rol) {
      this.userRole = typeof currentUser.rol === 'string' 
        ? currentUser.rol 
        : currentUser.rol.nombre;
      this.isUsuarioRole = this.userRole === 'USUARIO';
      console.log('MyPqrs - Rol detectado:', this.userRole, 'Es USUARIO:', this.isUsuarioRole);
    }
  }

  onFiltroChange() {
    console.log('=== onFiltroChange LLAMADO ===');
    console.log('Filtros actuales:', {
      estado: this.filtroEstado,
      prioridad: this.filtroPrioridad,
      search: this.searchTerm
    });
    
    this.currentPage = 0; // Resetear a primera página cuando cambian los filtros
    console.log('Página reseteada a 0');
    
    this.cargarMisPQRS();
  }

  limpiarFiltros() {
    console.log('=== LIMPIANDO FILTROS ===');
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.searchTerm = '';
    this.currentPage = 0;
    console.log('Filtros limpiados, recargando...');
    this.cargarMisPQRS();
  }
  
  // Método de prueba temporal para debugging
  probarFiltros() {
    console.log('=== PRUEBA DE FILTROS ===');
    this.filtroEstado = 'PENDIENTE';
    this.searchTerm = 'test';
    this.onFiltroChange();
  }

  // Métodos de paginación (backend)
  irAPagina(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.cargarMisPQRS();
    }
  }

  paginaAnterior() {
    if (!this.isFirst) {
      this.currentPage--;
      this.cargarMisPQRS();
    }
  }

  paginaSiguiente() {
    if (!this.isLast) {
      this.currentPage++;
      this.cargarMisPQRS();
    }
  }

  cambiarTamanoPagina(nuevoTamano: number) {
    this.pageSize = nuevoTamano;
    this.currentPage = 0; // Resetear a primera página
    this.cargarMisPQRS();
  }

  // Método para obtener array de páginas para mostrar en paginación
  getPaginasArray(): number[] {
    const maxPagesToShow = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPagesToShow - 1);
    
    // Ajustar startPage si estamos cerca del final
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Métodos auxiliares para el template
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'EN_PROCESO': return 'estado-proceso';
      case 'RESUELTO': return 'estado-resuelto';
      case 'CERRADO': return 'estado-cerrado';
      default: return 'estado-default';
    }
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad) {
      case 'ALTA': return 'prioridad-alta';
      case 'MEDIA': return 'prioridad-media';
      case 'BAJA': return 'prioridad-baja';
      default: return 'prioridad-default';
    }
  }

  getDiasRestantes(fechaCreacion: string): number {
    const fechaCreacionDate = new Date(fechaCreacion);
    const fechaLimite = new Date(fechaCreacionDate);
    fechaLimite.setDate(fechaLimite.getDate() + 15); // 15 días hábiles
    
    const hoy = new Date();
    const diferencia = fechaLimite.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }

  // Métodos para manejo de dropdowns y estados
  mostrarOpcionesEstado(event: Event, pqrs: PQRS) {
    event.stopPropagation();
    this.cerrarDropdowns();
    
    const dropdown = (event.target as Element).closest('.dropdown')?.querySelector('.dropdown-menu');
    if (dropdown) {
      dropdown.classList.add('show');
    }
  }

  seleccionarEstado(pqrs: PQRS, nuevoEstado: string) {
    if (nuevoEstado !== pqrs.estadoPqrs) {
      this.cambiarEstado(pqrs.idPqrs, nuevoEstado);
    }
    this.cerrarDropdowns();
  }

  async cambiarEstado(idPqrs: number, estado: string) {
    try {
      await this.pqrsService.cambiarEstado(idPqrs, estado).toPromise();
      this.cargarMisPQRS(false); // Recargar sin mostrar loading
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }

  cerrarDropdowns() {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.cerrarDropdowns();
  }
}
