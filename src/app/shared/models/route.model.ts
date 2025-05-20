// src/app/core/models/route.model.ts
export interface Route {
    idRuta: number;
    idModulo: number;
    nombreModulo: string;
    ruta: string;
    descripcion: string;
    estado: boolean;
    esPublica: boolean;
    fechaCreacion: string;
  }
  
  export interface RolePermission {
    idPermiso: number;
    idRol: number;
    idRuta: number;
    puedeLeer: boolean;
    puedeEscribir: boolean;
    puedeActualizar: boolean;
    puedeEliminar: boolean;
    estado: boolean;
  }