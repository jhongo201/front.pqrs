import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { PqrsService } from '../../core/services/pqrs.service';
import { forkJoin } from 'rxjs';


interface LabelMap {
  [key: string]: string;
  ALTA: string;
  MEDIA: string;
  BAJA: string;
 }

 export interface DashboardStats {
  porEstado: Record<string, number>;
  porPrioridad: Record<string, number>;
  estadosHoy: Record<string, number>;
  estadosSemana: Record<string, number>;
  estadosMes: Record<string, number>;
  prioridadesHoy: Record<string, number>;
  prioridadesSemana: Record<string, number>;
  prioridadesMes: Record<string, number>;
 }

 interface StatsData {
  pqrs: {
    porEstado: { [key: string]: number };
    porPrioridad: { [key: string]: number };
    estadosDia: { [key: string]: number }; 
    estadosHoy: { [key: string]: number };
    estadosSemana: { [key: string]: number };
    estadosMes: { [key: string]: number };
    prioridadesHoy: { [key: string]: number };
    prioridadesSemana: { [key: string]: number };
    prioridadesMes: { [key: string]: number };
    pqrsHoy: number;
    pqrsSemana: number;
    pqrsMes: number;
    totalHoy: number;
    totalSemana: number;
  };
  usuarios: {
    usuariosHoy: number;
    usuariosSemana: number;
    usuariosMes: number;
    porEstado: { [key: string]: number };
  };
 }

 interface PerformanceMetrics {
  responseTime: {
    average: number;
    byPriority: { [key: string]: number };
  };
  resolutionRate: {
    daily: number;
    weekly: number;
    monthly: number;
  };
 }

 interface TabData {
  id: string;
  label: string;
  icon: string;
 }

 export type PeriodType = 'day' | 'week' | 'month';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: StatsData = {
    pqrs: {
      porEstado: {},
      porPrioridad: {},
      estadosDia: {},
      estadosHoy: {},
      estadosSemana: {},
      estadosMes: {},
      prioridadesHoy: {},
      prioridadesSemana: {},
      prioridadesMes: {},
      pqrsHoy: 0,
      pqrsSemana: 0,
      pqrsMes: 0,
      totalHoy: 0,
      totalSemana: 0,
    },
    usuarios: {
      usuariosHoy: 0,
      usuariosSemana: 0,
      usuariosMes: 0,
      porEstado: {}
    }
  };

  metrics: PerformanceMetrics = {
    responseTime: {
      average: 0,
      byPriority: {}
    },
    resolutionRate: {
      daily: 0,
      weekly: 0,
      monthly: 0
    }
  };

  tabs: TabData[] = [
    { id: 'overview', label: 'Vista General', icon: 'chart-bar' },
    /*{ id: 'priority', label: 'Por Prioridad', icon: 'flag' },
    { id: 'status', label: 'Por Estado', icon: 'circle-check' },
    { id: 'trends', label: 'Tendencias', icon: 'trending-up' }*/
  ];
  
  activeTab = 'overview';
  loading = true;
  error = '';

  estadosOrden = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
  prioridadesOrden = ['ALTA', 'MEDIA', 'BAJA'];

  selectedPeriod: PeriodType = 'day';
  periods: PeriodType[] = ['day', 'week', 'month'];
  periodos: Array<'Hoy' | 'Semana' | 'Mes'> = ['Hoy', 'Semana', 'Mes'];

  constructor(private pqrsService: PqrsService) {}

  ngOnInit() {
    this.pqrsService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.error = 'Error cargando estadísticas';
        this.loading = false;
      }
    });
  }

  getOrderedKeys(data: any, ordenArray: string[]): string[] {
    if (!data) return [];
    return ordenArray.filter(key => data[key] !== undefined);
  }


  hasStats(data: any): boolean {
    return data && Object.keys(data).length > 0;
  }

  getTotalPQRS(): number {
    const estados = this.stats.pqrs?.porEstado;
    if (!estados) return 0;
    return Object.values(estados).reduce((a: number, b: number) => a + b, 0);
  }

  getEstadoCount(estado: string): number {
    return this.stats.pqrs?.porEstado?.[estado] || 0;
  }

  formatEstado(estado: string): string {
    return estado.replace('_', ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  formatPrioridad(prioridad: string): string {
    const labels: LabelMap = {
      'ALTA': 'Alta',
      'MEDIA': 'Media',
      'BAJA': 'Baja'
    };
    return labels[prioridad as keyof LabelMap] || prioridad;
  }

  getPercentage(value: number, total: number): string {
    if (!total) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  }
 
  getTimeComparison(today: number, week: number): string {
    const diff = today - (week / 7);
    if (diff === 0) return 'igual que ayer';
    return diff > 0 ? `↑ ${diff.toFixed(0)} más que ayer` : `↓ ${Math.abs(diff).toFixed(0)} menos que ayer`;
  }

  getEstadoCountByPeriod(estado: string, periodo: string): number {
    switch(periodo) {
      case 'Hoy':
        return this.stats.pqrs.estadosDia?.[estado] || 0;
      case 'Semana':
        return this.stats.pqrs.estadosHoy?.[estado] || 0; // semana actual
      case 'Mes':
        return this.stats.pqrs.estadosMes?.[estado] || 0;
      default:
        return 0;
    }
  }

  // Para cálculos de tendencias
getEstadoCountTrend(estado: string, periodo: 'Hoy' | 'Semana' | 'Mes'): number {
  const currentDate = new Date();
  const weeklyCount = this.stats.pqrs.estadosSemana?.[estado] || 0;
  return periodo === 'Semana' ? weeklyCount / Math.min(currentDate.getDay() + 1, 7) : 
         this.getEstadoCountByPeriod(estado, periodo);
}

getPrioridadCountByPeriod(prioridad: string, periodo: string): number {
  switch(periodo) {
    case 'Hoy':
      return this.stats.pqrs.prioridadesHoy?.[prioridad] || 0;
    case 'Semana':
      return this.stats.pqrs.prioridadesHoy?.[prioridad] || 0; // semana actual
    case 'Mes':
      return this.stats.pqrs.prioridadesMes?.[prioridad] || 0;
    default:
      return 0;
  }
}

   getEstadoValue(estado: string): number {
    return this.stats.pqrs?.porEstado?.[estado] || 0;
   }

   getTrendComparison(): string {
    const today = this.stats.pqrs?.totalHoy || 0;
    const week = this.stats.pqrs?.totalSemana || 0;
    return this.getTimeComparison(today, week);
   }

   getTrendPercentage(current: number, previous: number): string {
    if (previous === 0 && current > 0) return '+100%';
    if (previous === 0 && current === 0) return '0%';
    if (current === 0 && previous > 0) return '-100%';
    
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }
 
  getTrendDirection(estado: string): string {
    const currentValue = this.stats.pqrs.porEstado?.[estado] || 0;
    const lastWeek = this.stats.pqrs.estadosSemana?.[estado] || 0;
    
    if (currentValue === lastWeek) return 'neutral';
    return currentValue > lastWeek ? 'up' : 'down';
  }
 
  getStatusTrend(estado: string): string {
    const currentStats = this.stats.pqrs.estadosHoy?.[estado] || 0;
    const lastWeekStats = this.stats.pqrs.estadosSemana?.[estado] || 0;
  
    console.log(`${estado} - Actual: ${currentStats}, Anterior: ${lastWeekStats}`);
  
    if (lastWeekStats === 0 && currentStats === 0) return '0%';
    if (lastWeekStats === 0) return `+${currentStats}%`;
    if (currentStats === 0) return '-100%';
  
    const change = ((currentStats - lastWeekStats) / lastWeekStats) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  setPeriod(period: 'day' | 'week' | 'month') {
    this.selectedPeriod = period;
  }

  calculateResolutionRate(period: 'day' | 'week' | 'month'): number {
    const resueltos = this.getEstadoCountByPeriod('RESUELTO', period === 'day' ? 'Hoy' : 
                      period === 'week' ? 'Semana' : 'Mes');
    const total = this.stats.pqrs[period === 'day' ? 'pqrsHoy' : 
                  period === 'week' ? 'pqrsSemana' : 'pqrsMes'];
    return total ? (resueltos / total) * 100 : 0;
  }
 
  getEfficiencyScore(): number {
    const resolutionRate = this.calculateResolutionRate(this.selectedPeriod);
    const pendingRate = (this.getEstadoValue('PENDIENTE') / this.getTotalPQRS()) * 100;
    return Math.max(0, 100 - (pendingRate * 0.5));
  }

  getPrioridadValue(prioridad: string): number {
    return this.stats.pqrs?.porPrioridad?.[prioridad] || 0;
  }

  getPeriodLabel(period: PeriodType): string {
    const labels: Record<PeriodType, string> = {
      'day': 'Hoy',
      'week': 'Semana',
      'month': 'Mes'
    };
    return labels[period];
  }

  getCurrentWeekRange(): string {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    return `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
  }

  getPreviousWeekRange(): string {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const lastMonday = new Date(monday);
    lastMonday.setDate(lastMonday.getDate() - 7);
    const lastSunday = new Date(monday);
    lastSunday.setDate(lastSunday.getDate() - 1);
    
    return `${lastMonday.toLocaleDateString()} - ${lastSunday.toLocaleDateString()}`;
  }
  
  getTrendIcon(estado: string): string {
    const direction = this.getTrendDirection(estado);
    return direction === 'up' ? 'fas fa-arrow-up' :
           direction === 'down' ? 'fas fa-arrow-down' : 
           'fas fa-minus';
  }

  getPercentageWidth(estado: string): string {
    const percentage = this.getPercentage(this.getEstadoValue(estado), this.getTotalPQRS());
    return `${percentage.replace('%', '')}%`;
  }

  getStatWidth(estado?: string): string {
    if (!estado) return '100%';
    return `${(this.getEstadoValue(estado) / this.getTotalPQRS() * 100).toFixed(0)}%`;
  }

}