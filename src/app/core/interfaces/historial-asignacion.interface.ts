// src/app/core/interfaces/historial-asignacion.interface.ts
export interface HistorialAsignacion {
    idHistorial: number;
    usuarioAnterior: string;
    usuarioNuevo: string;
    areaAnterior: string;
    areaNueva: string;
    motivoCambio: string;
    fechaAsignacion: string;
}