// my-pqrs.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PqrsService } from '../../../core/services/pqrs.service';
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
  refreshInterval: any;
  private destroy$ = new Subject<void>();

  constructor(private pqrsService: PqrsService) {}

  ngOnInit() {
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
    
    this.pqrsService.listarMisPQRS()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pqrsList = this.ordenarPQRS(data);
          this.aplicarFiltros();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Error al cargar los PQRS asignados';
          this.isLoading = false;
          console.error('Error:', error);
        }
      });
  }

  private ordenarPQRS(pqrs: PQRS[]): PQRS[] {
    const prioridadOrder: { [key: string]: number } = {
      'ALTA': 0,
      'MEDIA': 1,
      'BAJA': 2
    };

    return pqrs.sort((a, b) => {
      // Primero por prioridad
      const prioridadA = prioridadOrder[a.prioridad] ?? 999;
      const prioridadB = prioridadOrder[b.prioridad] ?? 999;
      
      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }
      
      // Luego por fecha de creación (más recientes primero)
      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
    });
  }

  // Agregar método para manejar el cambio de estado
  mostrarOpcionesEstado(event: Event, pqrs: PQRS) {
    event.stopPropagation();
    // Limpiar estado activo de otros dropdowns
    this.filteredPqrsList.forEach(p => p['showEstados'] = false);
    // Toggle el dropdown actual
    pqrs['showEstados'] = !pqrs['showEstados'];
  }

  seleccionarEstado(pqrs: PQRS, nuevoEstado: string) {
    pqrs['showEstados'] = false; // Cerrar dropdown
    if (nuevoEstado !== pqrs.estadoPqrs) {
      this.cambiarEstado(pqrs.idPqrs, nuevoEstado);
    }
  }

  // Método para cerrar dropdowns cuando se hace clic fuera
  @HostListener('document:click')
  cerrarDropdowns() {
    if (this.filteredPqrsList) {
      this.filteredPqrsList.forEach(pqrs => pqrs['showEstados'] = false);
    }
  }

  aplicarFiltros() {
    this.filteredPqrsList = this.pqrsList.filter(pqrs => {
      const cumpleEstado = !this.filtroEstado || pqrs.estadoPqrs === this.filtroEstado;
      const cumplePrioridad = !this.filtroPrioridad || pqrs.prioridad === this.filtroPrioridad;
      const cumpleBusqueda = !this.searchTerm || 
        pqrs.numeroRadicado.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pqrs.titulo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pqrs.nombreSolicitante.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return cumpleEstado && cumplePrioridad && cumpleBusqueda;
    });
  }

  onFiltroChange() {
    this.aplicarFiltros();
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

  getDiasRestantes(fechaCreacion: string): number {
    const diasHabiles = 15;
    const fecha = new Date(fechaCreacion);
    const hoy = new Date();
    const diferencia = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
    return diasHabiles - Math.abs(diferencia);
  }

  async cambiarEstado(idPqrs: number, estado: string) {
    try {
      this.isLoading = true;
      await this.pqrsService.actualizarEstado(idPqrs, estado).toPromise();
      this.cargarMisPQRS();
    } catch (error) {
      this.error = 'Error al actualizar el estado';
      this.isLoading = false;
      console.error('Error:', error);
    }
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.searchTerm = '';
    this.aplicarFiltros();
  }
}