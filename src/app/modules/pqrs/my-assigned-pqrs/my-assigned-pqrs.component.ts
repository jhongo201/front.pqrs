// my-assigned-pqrs.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PqrsService } from '../../../core/services/pqrs.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';

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
}

interface AsignacionPQRS {
  usuario: {
    idUsuario: number;
    nombreCompleto: string;
  };
  pqrsAsignados: any[];
}

@Component({
  selector: 'app-my-assigned-pqrs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-assigned-pqrs.component.html',
  styleUrls: ['./my-assigned-pqrs.component.css']
})
export class MyAssignedPqrsComponent implements OnInit, OnDestroy {
  asignacion: AsignacionPQRS | null = null;
  filteredPqrsList: any[] = [];
  isLoading = false;
  error = '';
  private destroy$ = new Subject<void>();

  // Variables para filtros
  filtroEstado: string = '';
  filtroPrioridad: string = '';
  searchTerm: string = '';
  
  estados: string[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
  prioridades: string[] = ['ALTA', 'MEDIA', 'BAJA'];

  constructor(
    private pqrsService: PqrsService,
    private userService: UserService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.cargarMisAsignaciones();
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
    switch (prioridad?.toUpperCase()) {
      case 'ALTA': return 'prioridad-alta';
      case 'MEDIA': return 'prioridad-media';
      case 'BAJA': return 'prioridad-baja';
      default: return '';
    }
  }

  getDiasRestantes(fechaCreacion: string): number {
    if (!fechaCreacion) return 0;
  
    const DIAS_HABILES_LIMITE = 15; // El límite de días hábiles para responder
    
    // Convertir la fecha de creación a objeto Date
    const fechaInicio = new Date(fechaCreacion);
    const fechaActual = new Date();
    
    // Validar que la fecha sea válida
    if (isNaN(fechaInicio.getTime())) {
      console.error('Fecha de creación inválida:', fechaCreacion);
      return 0;
    }
  
    // Calcular la diferencia en días
    const diferenciaMilisegundos = fechaActual.getTime() - fechaInicio.getTime();
    const diferenciaDias = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    
    // Calcular días restantes
    const diasRestantes = DIAS_HABILES_LIMITE - diferenciaDias;
    
    // No permitir números negativos, mínimo 0 días
    return Math.max(0, diasRestantes);
  }
  
  // Si prefieres un cálculo más preciso que considere solo días hábiles,
  // puedes usar esta versión alternativa:
  
  getDiasHabilesRestantes(fechaCreacion: string): number {
    if (!fechaCreacion) return 0;
  
    const DIAS_HABILES_LIMITE = 15;
    const fechaInicio = new Date(fechaCreacion);
    const fechaActual = new Date();
    
    if (isNaN(fechaInicio.getTime())) {
      console.error('Fecha de creación inválida:', fechaCreacion);
      return 0;
    }
  
    let diasHabiles = 0;
    const fechaTemp = new Date(fechaInicio);
    
    while (fechaTemp <= fechaActual) {
      // 0 = Domingo, 6 = Sábado
      const dia = fechaTemp.getDay();
      if (dia !== 0 && dia !== 6) {
        diasHabiles++;
      }
      fechaTemp.setDate(fechaTemp.getDate() + 1);
    }
  
    return Math.max(0, DIAS_HABILES_LIMITE - diasHabiles);
  }
  
  // Método auxiliar para formatear la fecha
  private formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }


  aplicarFiltros() {
    if (!this.asignacion) {
      this.filteredPqrsList = [];
      return;
    }

    this.filteredPqrsList = this.asignacion.pqrsAsignados.filter(pqrs => {
      const cumpleEstado = !this.filtroEstado || pqrs.estadoPqrs === this.filtroEstado;
      const cumplePrioridad = !this.filtroPrioridad || pqrs.prioridad === this.filtroPrioridad;
      const searchTermLower = this.searchTerm.toLowerCase();
      const cumpleBusqueda = !this.searchTerm || 
        pqrs.numeroRadicado.toLowerCase().includes(searchTermLower) ||
        pqrs.titulo.toLowerCase().includes(searchTermLower) ||
        pqrs.nombreSolicitante.toLowerCase().includes(searchTermLower);

      return cumpleEstado && cumplePrioridad && cumpleBusqueda;
    });

    // Ordenar por prioridad y fecha
    this.filteredPqrsList.sort((a, b) => {
      const prioridadOrder: { [key: string]: number } = {
        'ALTA': 0,
        'MEDIA': 1,
        'BAJA': 2
      };
      
      const prioridadA = prioridadOrder[a.prioridad] ?? 999;
      const prioridadB = prioridadOrder[b.prioridad] ?? 999;
      
      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }
      
      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
    });
  }

  onFiltroChange() {
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.searchTerm = '';
    this.aplicarFiltros();
  }

  async cargarMisAsignaciones() {
    try {
      this.isLoading = true;
      this.error = '';
      
      const currentUser = await this.userService.getCurrentUser().toPromise();
      const pqrsList = await this.pqrsService.listarPQRS().toPromise();
      
      if (!currentUser || !pqrsList) {
        throw new Error('No se pudieron cargar los datos necesarios');
      }
  
      const misPqrs = pqrsList.filter(pqrs => 
        pqrs.usuarioAsignado?.idUsuario === currentUser.idUsuario
      );
  
      this.asignacion = {
        usuario: {
          idUsuario: currentUser.idUsuario,
          nombreCompleto: `${currentUser.nombres} ${currentUser.apellidos}`
        },
        pqrsAsignados: misPqrs
      };
  
      this.filteredPqrsList = misPqrs;
      this.aplicarFiltros();
      
    } catch (error) {
      console.error('Error:', error);
      this.error = 'Error al cargar las Solicitudes asignadas';
    } finally {
      this.isLoading = false;
    }
  }

}