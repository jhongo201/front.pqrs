import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { User, UserDetail, UpdateUserRequest, DeleteUserRequest  } from '../../shared/models/user.model';
import { BasePaginatedService } from './base-paginated.service';
import { environment } from '../../../environments/environment';
import { PageRequest, PageResponse } from '../../shared/models/pagination.model';
import { LdapUser, LdapUserCreate, LdapUserUpdate } from '../../shared/models/ldap-user.model';


interface UsuarioInfoCompleta {
  idUsuario: number;
  username: string;
  estado: boolean;
  fechaCreacion: string;
  rol: string;
  // Información de la persona
  idPersona: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
  telefono: string;
  estadoPersona: boolean;
  fechaCreacionPersona: string;
  // Información del área
  idArea: number;
  nombreArea: string;
  estadoArea: boolean;
  // Información de la dirección
  idDireccion: number;
  nombreDireccion: string;
  estadoDireccion: boolean;
  // Información de la territorial
  idTerritorial: number;
  nombreTerritorial: string;
  estadoTerritorial: boolean;
  // Información de la empresa
  idEmpresa: number;
  nombreEmpresa: string;
  estadoEmpresa: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class UserService extends BasePaginatedService<User>  {

  private apiUrl = `${environment.apiUrl}/usuarios`;  // Cambia esto a la URL de tu API
  private apiUrlBase = `${environment.apiUrl}`; // Ajusta según tu API';  // Cambia esto a la URL de tu API

  constructor(http: HttpClient) { 
    super(http, `${environment.apiUrl}/usuarios`);
  }

  // Método para cargar empresas, áreas, roles
  private getRequestHeaders() {
    const token = localStorage.getItem('token'); // O desde otro lugar donde se guarda el token
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

   // Sobrescribimos el método getPage para adaptar la respuesta
   override getPage(pageRequest: PageRequest): Observable<PageResponse<User>> {
    return this.getUsers().pipe(
      map(users => {
        // Calculamos los índices para la paginación
        const startIndex = (pageRequest.page - 1) * pageRequest.size;
        const endIndex = startIndex + pageRequest.size;
        
        // Obtenemos solo los usuarios de la página actual
        const paginatedUsers = users.slice(startIndex, endIndex);
        
        // Creamos la respuesta paginada
        return {
          content: paginatedUsers,
          totalElements: users.length,
          totalPages: Math.ceil(users.length / pageRequest.size),
          number: pageRequest.page - 1,
          size: pageRequest.size
        };
      })
    );
  }

  // Mantener el método original para compatibilidad
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  //filtrar usuario por id
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // Obtener lista de áreas
  getAreas() {
    return this.http.get(`${this.apiUrlBase}/areas`, {
      headers: this.getRequestHeaders(),
    });
  }

  // Obtener lista de roles
  getRoles() {
    return this.http.get(`${this.apiUrlBase}/roles`, {
      headers: this.getRequestHeaders(),
    });
  }

  // Obtener lista de empresas
  getEmpresas() {
    return this.http.get(`${this.apiUrlBase}/empresas`, {
      headers: this.getRequestHeaders(),
    });
  }

  // Obtener lista de departamentos
  getDepartamentos(): Observable<any> {
    return this.http.get(`${this.apiUrlBase}/departamentos`);
  }

  // Obtener municipios por código de departamento
  getMunicipiosByDepartamento(codigoDepartamento: string): Observable<any> {
    return this.http.get(`${this.apiUrlBase}/municipios/departamento/${codigoDepartamento}`);
  }

  // Obtener tipos de documento
  getTiposDocumento(): Observable<any> {
    return this.http.get(`${this.apiUrlBase}/tipodocumentos`);
  }

  // Crear usuario
 /*createUser(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/registro`, userData);
  }*/
  // Método actual para crear usuarios (interno)
  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, userData, {
      headers: this.getRequestHeaders()
    });
  }

  // Nuevo método para registro externo
   // Nuevo método para registro externo
   registerExternalUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, userData);
  }

  // Consulta Usuario con toda su informacion detallada
  getUserDetailById(id: number): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.apiUrl}/${id}/info-completa`);
  }

  //Elimina Usuario
  deleteUser(userId: number, deleteRequest: DeleteUserRequest): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}`, {
      body: deleteRequest,
      headers: this.getRequestHeaders()
    });
  }

  //Actualiza el username y contrasena del usuario
  updateUser(userId: number, updateRequest: UpdateUserRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${userId}`, updateRequest, {
      headers: this.getRequestHeaders()
    });
  }

  // Reenvia correo de activacion al usuario
  resendActivationEmail(username: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reenviar-activacion`, null, {
      params: { username },
      headers: this.getRequestHeaders()
    });
  }

  // Crear usuario LDAP
  createLdapUser(userData: LdapUserCreate): Observable<any> {
    return this.http.post(`${this.apiUrl}/ldap`, userData, {
      headers: this.getRequestHeaders()
    });
  }

  // Actualizar usuario LDAP
  updateLdapUser(id: number, userData: LdapUserUpdate): Observable<any> {
    return this.http.put(`${this.apiUrl}/ldap/${id}`, userData, {
      headers: this.getRequestHeaders()
    });
  }

  // Eliminar usuario LDAP
  deleteLdapUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ldap/${id}`, {
      headers: this.getRequestHeaders()
    });
  }

  // Obtener usuarios LDAP
  getLdapUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ldap`, {
      headers: this.getRequestHeaders()
    });
  }

  obtenerReportes(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
  
    return this.http.get(`${this.apiUrl}/reportes`, { params });
  }
  
  exportarReporte(formato: string, fechaInicio: string, fechaFin: string): Observable<Blob> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('formato', formato);
  
    return this.http.get(`${this.apiUrl}/reportes/exportar`, {
      params,
      responseType: 'blob'
    });
  }
  
  obtenerEstadisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`);
  }

  getUsuariosPorArea(areaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/area/${areaId}`);
  }

  getCurrentUser(): Observable<UsuarioInfoCompleta> {
    return this.http.get<UsuarioInfoCompleta>(`${this.apiUrl}/current`);
  }


  getUserStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrlBase}/usuarios/estadisticas`);
  }











}
