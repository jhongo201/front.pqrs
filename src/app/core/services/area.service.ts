// area.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private apiUrl = `${environment.apiUrl}/areas`;

  constructor(private http: HttpClient) { }

  listarAreas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obtenerArea(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
