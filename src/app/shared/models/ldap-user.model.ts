export interface Role {
    id: number;
    nombre: string;
  }
  
export interface LdapUserCreate {
    username: string;
    idRol: number;
    estado: boolean;
  }
  
  export interface LdapUserUpdate {
    idUsuario: number;
    idRol: number;
    estado: boolean;
  }
  
  export interface LdapUser {
    id: number;
    username: string;
    rol: {
      id: number;
      nombre: string;
    };
    estado: boolean;
  }