// pqrs-reports.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PqrsService } from '../../../core/services/pqrs.service';


interface ReportData {
  totalPqrs: number;
  porEstado: {
    estado: string;
    cantidad: number;
  }[];
  porPrioridad: {
    prioridad: string;
    cantidad: number;
  }[];
  porArea: {
    area: string;
    cantidad: number;
  }[];
  tiempoPromedio: number;
  tendenciaMensual: {
    mes: string;
    cantidad: number;
  }[];
}

@Component({
  selector: 'app-pqrs-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pqrs-reports.component.html',
  styleUrls: ['./pqrs-reports.component.css']
})
export class PqrsReportsComponent implements OnInit {
  reportData: ReportData | null = null;
  isLoading = false;
  error = '';
  periodoSeleccionado = 'mes'; // 'mes', 'trimestre', 'año'
  fechaInicio: string;
  fechaFin: string;

  constructor(private pqrsService: PqrsService) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    this.fechaInicio = inicioMes.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.cargarReporte();
  }

  cargarReporte() {
    this.isLoading = true;
    this.pqrsService.obtenerEstadisticasReportes(this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => {
        this.reportData = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar reportes';
        this.isLoading = false;
      }
    });
  }

  // Añadimos el método maxTendencia
  maxTendencia(): number {
    if (!this.reportData?.tendenciaMensual?.length) return 0;
    return Math.max(...this.reportData.tendenciaMensual.map(punto => punto.cantidad));
  }

  cambiarPeriodo(periodo: string) {
    this.periodoSeleccionado = periodo;
    const hoy = new Date();
    
    switch (periodo) {
      case 'mes':
        this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
          .toISOString().split('T')[0];
        break;
      case 'trimestre':
        this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1)
          .toISOString().split('T')[0];
        break;
      case 'año':
        this.fechaInicio = new Date(hoy.getFullYear(), 0, 1)
          .toISOString().split('T')[0];
        break;
    }
    
    this.fechaFin = hoy.toISOString().split('T')[0];
    this.cargarReporte();
  }

  exportarReporte(formato: 'excel' | 'pdf') {
    if (!this.reportData) return;
    
    if (formato === 'excel') {
      this.pqrsService.exportarExcel(this.reportData);
    } else {
      this.pqrsService.exportarPDF(this.reportData);
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

  getPrioridadClass(prioridad: string): string {
    switch (prioridad.toUpperCase()) {
      case 'ALTA': return 'prioridad-alta';
      case 'MEDIA': return 'prioridad-media';
      case 'BAJA': return 'prioridad-baja';
      default: return '';
    }
  }

  getMonthColor(index: number): string {
    const colors = [
      '#3b82f6', // Azul
      '#10b981', // Verde
      '#f59e0b', // Naranja
      '#6366f1', // Indigo
      '#ec4899', // Rosa
      '#8b5cf6', // Violeta
      '#14b8a6', // Turquesa
      '#f43f5e', // Rojo
      '#84cc16', // Lima
      '#06b6d4', // Cyan
      '#a855f7', // Púrpura
      '#eab308'  // Amarillo
    ];
    
    return colors[index % colors.length];
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      'PENDIENTE': '#fbbf24',
      'EN_PROCESO': '#60a5fa',
      'RESUELTO': '#34d399',
      'CERRADO': '#9ca3af'
    };
    return colors[estado] || '#cbd5e1';
   }

   getRotation(index: number, estados: any[]): number {
    const totalPqrs = this.reportData?.totalPqrs || 1; // Usa 1 como fallback
    let rotation = 0;
    for (let i = 0; i < index; i++) {
      rotation += (estados[i].cantidad / totalPqrs) * 360;
    }
    return rotation;
  }

}