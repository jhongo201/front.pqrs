export interface Empresa {
  id: number;
  nombre: string;
}

export interface Direccion {
  id: number;
  nombre: string;
}

export interface Area {
  id: number;
  nombre: string;
}



export interface UserData {
  username: string;
  nombreCompleto: string;
  rol: string;
  empresa: Empresa;
  direccion: Direccion;
  area: Area;
}

// src/shared/models/user.model.ts

export interface Persona {
  nombres?: string;
  apellidos?: string;
  email?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface User {
  id: number;
  username: string;
  persona?: Persona; // Hacemos opcional la propiedad persona
  rol: Rol;
  ultimoLogin: string;
  fechaCreacion: string;
  estado: boolean;
  esLdap?: boolean; // Indica si el usuario es de LDAP (basado en el dominio @mintrabajo.loc)
}


// src/app/core/models/auth.model.ts
export interface LoginResponse {
  message: string;
  token: string;
  username: string;
  rol: string;
  nombreCompleto: string;
  area: {
    id: number;
    nombre: string;
  };
  direccion: {
    id: number;
    nombre: string;
  };
  empresa: {
    id: number;
    nombre: string;
  };
}

// informacion completa del usuario
export interface UserDetail {
  idUsuario: number;
  username: string;
  estado: boolean;
  fechaCreacion: string;
  rol: string;
  idPersona: number;
  nombres: string;
  apellidos: string;
  email: string;
  estadoPersona: boolean;
  fechaCreacionPersona: string;
  idArea: number;
  nombreArea: string;
  estadoArea: boolean;
  idDireccion: number;
  nombreDireccion: string;
  estadoDireccion: boolean;
  idTerritorial: number;
  nombreTerritorial: string;
  estadoTerritorial: boolean;
  idEmpresa: number;
  nombreEmpresa: string;
  estadoEmpresa: boolean;
}

export interface DeleteUserRequest {
  username: string;
}

export interface UpdateUserRequest {
  username: string;
  password: string;
}