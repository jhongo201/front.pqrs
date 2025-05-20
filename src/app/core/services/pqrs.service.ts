// pqrs.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HistorialAsignacion } from '../../core/interfaces/historial-asignacion.interface';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import 'jspdf-autotable';

interface PQRS {
  idPqrs: number;
  radicado: string;
  titulo: string;
  descripcion: string;
  estadoPqrs: string;
  prioridad: string;
  nombreSolicitante: string;
  emailSolicitante: string;
  telefonoSolicitante: string;
  tema: {
    idTema: number;
    nombre: string;
    area: {
      idArea: number;
      nombre: string;
    }
  };
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
}

export interface DashboardStats {
  porEstado: { [key: string]: number };
  porPrioridad: { [key: string]: number };
  estadosHoy: { [key: string]: number };
  estadosSemana: { [key: string]: number }; 
  estadosMes: { [key: string]: number };
  prioridadesHoy: { [key: string]: number };
  prioridadesSemana: { [key: string]: number };
  prioridadesMes: { [key: string]: number };
 }

 interface ReportData {
  totalPqrs: number;
  tiempoPromedio: number;
  porEstado: Array<{estado: string, cantidad: number}>;
  porPrioridad: Array<{prioridad: string, cantidad: number}>;
  porArea: Array<{area: string, cantidad: number}>;
  tendenciaMensual: Array<{mes: string, cantidad: number}>;
 }

 declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PqrsService {
  private apiUrl = `${environment.apiUrl}/pqrs`;

  constructor(private http: HttpClient) {}

  // Listar PQRS con filtros opcionales
listarPQRS(estado?: string, usuarioAsignado?: number): Observable<any[]> {
  let params = new HttpParams();
  if (estado) {
    params = params.set('estado', estado);
  }
  if (usuarioAsignado) {
    params = params.set('usuarioAsignado', usuarioAsignado.toString());
  }

  return this.http.get<any[]>(this.apiUrl, { params }).pipe(
    map(response => {
      if (Array.isArray(response)) {
        return response;
      }
      throw new Error('Formato de respuesta inválido');
    }),
    catchError(error => {
      console.error('Error en listarPQRS:', error);

      if (error.error && error.error.mensaje) {
        return throwError(() => new Error(error.error.mensaje));
      }

      return throwError(() => new Error('No se pudieron cargar las PQRS. Por favor, intente más tarde.'));
    })
  );
}



  // Obtener una PQRS específica
  obtenerPQRS(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Crear nueva PQRS (usuario registrado)
  // pqrs.service.ts
crearPQRS(formData: FormData): Observable<HttpEvent<any>> {
  return this.http.post<any>(this.apiUrl, formData, {
    reportProgress: true,
    observe: 'events'
  });
}

  // Crear PQRS pública
  crearPQRSPublica(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/publico`, data);
  }

  // Asignar PQRS a funcionario
  asignarPQRS(idPqrs: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idPqrs}/asignar`, data);
  }

  // Agregar seguimiento
  agregarSeguimiento(idPqrs: number, formData: FormData): Observable<HttpEvent<any>> {
    console.log('Enviando seguimiento:', {
      id: idPqrs,
      formData: Object.fromEntries(formData.entries()) // Para ver el contenido del FormData
    });
  
    return this.http.post<any>(
      `${this.apiUrl}/${idPqrs}/seguimiento`, 
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      catchError(error => {
        console.error('Error detallado al agregar seguimiento:', error);
        console.error('Error body:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Actualizar estado
  actualizarEstado(idPqrs: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idPqrs}/estado/${estado}`, {});
  }

  // Consultar por radicado
  consultarPorRadicado(radicado: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/radicado/${radicado}`);
  }

  // Listar PQRS del usuario actual
  listarMisPQRS(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-pqrs`);
  }

  // Listar PQRS sin asignar
  listarPQRSSinAsignar(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sin-asignar`);
  }

  // Consultar PQRS como solicitante público
  consultarPQRSPublica(radicado: string, token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/publico/consulta/${radicado}/${token}`);
  }

   // Método para respuesta de usuario registrado
   responderComoUsuarioRegistrado(idPqrs: number, formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post<any>(
        `${this.apiUrl}/${idPqrs}/respuesta-usuario`,
        formData,
        {
            reportProgress: true,
            observe: 'events'
        }
    );
}

  // Método para respuesta de usuario no registrado
  responderComoUsuarioPublico(radicado: string, tokenUuid: string, formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post<any>(
      `${this.apiUrl}/publico/respuesta/${radicado}/${tokenUuid}`,
      formData,
      {
        reportProgress: true,
        observe: 'events',
        // No establecer Content-Type, el navegador lo establecerá automáticamente con el boundary correcto
      }
    );
  }

  // Actualizar la consulta de archivo
  getFileUrl(archivoAdjunto: string): string {
    return `${environment.apiUrl}/files/${archivoAdjunto}`;
  }

  // Método para consultar PQRS público
  consultarPqrsPublico(numeroRadicado: string, tokenUuid: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/consulta/${numeroRadicado}/${tokenUuid}`
    ).pipe(
      catchError(error => {
        console.error('Error en consulta pública:', error);
        return throwError(() => error);
      })
    );
  }

  consultarPqrsPorToken(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/consulta/token/${token}`);
  }

  // Listar temas disponibles
  listarTemas(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/temas-pqrs`);
  }

  // pqrs.service.ts
  obtenerEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas/dashboard`).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error obteniendo estadísticas:', error);
        return throwError(() => error);
      })
    );
  }

  obtenerEstadisticasReportes(fechaInicio: string, fechaFin: string): Observable<ReportData> {
    const params = new HttpParams()
        .set('fechaInicio', fechaInicio + 'T00:00:00')
        .set('fechaFin', fechaFin + 'T23:59:59');
        
    return this.http.get<ReportData>(`${this.apiUrl}/estadisticas/reportes`, { params });
}

  obtenerHistorialAsignaciones(idPqrs: number): Observable<HistorialAsignacion[]> {
    return this.http.get<HistorialAsignacion[]>(`${this.apiUrl}/historial-asignaciones/${idPqrs}`).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error al obtener historial:', error);
        const mensaje = error.error?.error || 'Error al obtener el historial de asignaciones';
        return throwError(() => new Error(mensaje));
      })
    );
  }

  actualizarPrioridad(idPqrs: number, prioridad: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idPqrs}/prioridad/${prioridad}`, {}).pipe(
      catchError(error => {
        console.error('Error al actualizar prioridad:', error);
        return throwError(() => new Error('Error al actualizar la prioridad'));
      })
    );
  }

  getPqrsTimeStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas/tiempo`);
  }

  exportarExcel(data: ReportData) {
    const ws = XLSX.utils.json_to_sheet([
      { 'Estado': 'Pendientes', 'Cantidad': data.totalPqrs },
      { 'Tiempo Promedio': data.tiempoPromedio + ' días' }
    ]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte PQRS');
    XLSX.writeFile(wb, 'reporte_pqrs.xlsx');
  }
 
  exportarPDF(data: ReportData) {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Reporte PQRS', 14, 20);
  
    // Resumen
    doc.setFontSize(12);
    doc.text(`Total PQRS: ${data.totalPqrs}`, 14, 30);
    doc.text(`Tiempo Promedio: ${data.tiempoPromedio.toFixed(2)} días`, 14, 40);
  
    // Tabla estados
    doc.autoTable({
      startY: 50,
      head: [['Estado', 'Cantidad', 'Porcentaje']],
      body: data.porEstado.map(item => [
        item.estado,
        item.cantidad,
        ((item.cantidad / data.totalPqrs) * 100).toFixed(1) + '%'
      ])
    });
  
    doc.save('reporte_pqrs.pdf');
  }

}