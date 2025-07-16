import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PqrsService } from '../../../core/services/pqrs.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface UserStats {
  totalPqrs: number;
  porEstado: { [key: string]: number };
  porPrioridad: { [key: string]: number };
  pqrsRecientes: any[];
  pendientesRespuesta: number;
  tiempoPromedioRespuesta: number;
}

interface RecentPqrs {
  idPqrs: number;
  numeroRadicado: string;
  titulo: string;
  estadoPqrs: string;
  prioridad: string;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
  tema: {
    nombre: string;
    area: {
      nombre: string;
    }
  };
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userStats: UserStats = {
    totalPqrs: 0,
    porEstado: {},
    porPrioridad: {},
    pqrsRecientes: [],
    pendientesRespuesta: 0,
    tiempoPromedioRespuesta: 0
  };

  recentPqrs: RecentPqrs[] = [];
  loading = true;
  error = '';
  userName = '';

  // Configuración de estados y prioridades
  estadosConfig: { [key: string]: { label: string; color: string; icon: string } } = {
    'PENDIENTE': { label: 'Pendiente', color: 'bg-yellow-500', icon: 'clock' },
    'EN_PROCESO': { label: 'En Proceso', color: 'bg-blue-500', icon: 'cog' },
    'RESUELTO': { label: 'Resuelto', color: 'bg-green-500', icon: 'check-circle' },
    'CERRADO': { label: 'Cerrado', color: 'bg-gray-500', icon: 'x-circle' }
  };

  prioridadesConfig: { [key: string]: { label: string; color: string; textColor: string } } = {
    'ALTA': { label: 'Alta', color: 'bg-red-500', textColor: 'text-red-700' },
    'MEDIA': { label: 'Media', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    'BAJA': { label: 'Baja', color: 'bg-green-500', textColor: 'text-green-700' }
  };

  constructor(
    private pqrsService: PqrsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('UserDashboard - Componente inicializado');
    this.loadUserInfo();
    this.loadUserDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserInfo() {
    this.authService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userData => {
        if (userData) {
          this.userName = userData.nombreCompleto || userData.username;
        }
      });
  }

  private loadUserDashboardData() {
    this.loading = true;
    this.error = '';

    // Cargar PQRS del usuario
    this.pqrsService.listarMisPQRS()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pqrsList) => {
          this.processUserStats(pqrsList);
          this.processRecentPqrs(pqrsList);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando datos del dashboard:', error);
          this.error = 'Error al cargar los datos del dashboard';
          this.loading = false;
        }
      });
  }

  private processUserStats(pqrsList: any[]) {
    this.userStats.totalPqrs = pqrsList.length;
    
    // Procesar estadísticas por estado
    this.userStats.porEstado = {};
    pqrsList.forEach(pqrs => {
      const estado = pqrs.estadoPqrs;
      this.userStats.porEstado[estado] = (this.userStats.porEstado[estado] || 0) + 1;
    });

    // Procesar estadísticas por prioridad
    this.userStats.porPrioridad = {};
    pqrsList.forEach(pqrs => {
      const prioridad = pqrs.prioridad;
      this.userStats.porPrioridad[prioridad] = (this.userStats.porPrioridad[prioridad] || 0) + 1;
    });

    // Calcular PQRS pendientes de respuesta (EN_PROCESO que requieren acción del usuario)
    this.userStats.pendientesRespuesta = pqrsList.filter(pqrs => 
      pqrs.estadoPqrs === 'EN_PROCESO'
    ).length;

    // Calcular tiempo promedio de respuesta (simplificado)
    const pqrsResueltas = pqrsList.filter(pqrs => pqrs.estadoPqrs === 'RESUELTO' || pqrs.estadoPqrs === 'CERRADO');
    if (pqrsResueltas.length > 0) {
      const tiempos = pqrsResueltas.map(pqrs => {
        const fechaCreacion = new Date(pqrs.fechaCreacion);
        const fechaActualizacion = new Date(pqrs.fechaUltimaActualizacion);
        return Math.floor((fechaActualizacion.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
      });
      this.userStats.tiempoPromedioRespuesta = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
    }
  }

  private processRecentPqrs(pqrsList: any[]) {
    // Ordenar por fecha de creación (más recientes primero) y tomar los primeros 5
    this.recentPqrs = pqrsList
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 5)
      .map(pqrs => ({
        idPqrs: pqrs.idPqrs,
        numeroRadicado: pqrs.numeroRadicado,
        titulo: pqrs.titulo,
        estadoPqrs: pqrs.estadoPqrs,
        prioridad: pqrs.prioridad,
        fechaCreacion: pqrs.fechaCreacion,
        fechaUltimaActualizacion: pqrs.fechaUltimaActualizacion,
        tema: pqrs.tema
      }));
  }

  getEstadoConfig(estado: string) {
    return this.estadosConfig[estado] || { label: estado, color: 'bg-gray-500', icon: 'question' };
  }

  getPrioridadConfig(prioridad: string) {
    return this.prioridadesConfig[prioridad] || { label: prioridad, color: 'bg-gray-500', textColor: 'text-gray-700' };
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getEstadoKeys(): string[] {
    return Object.keys(this.userStats.porEstado);
  }

  getPrioridadKeys(): string[] {
    return Object.keys(this.userStats.porPrioridad);
  }

  refreshData() {
    this.loadUserDashboardData();
  }
}
