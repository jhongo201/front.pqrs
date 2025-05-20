// src/app/core/services/base-paginated.service.ts
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export abstract class BasePaginatedService<T> {
  protected constructor(
    protected http: HttpClient,
    protected baseUrl: string
  ) {}

  protected getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getPage(pageRequest: PageRequest): Observable<PageResponse<T>> {
    let params = new HttpParams()
      .set('page', (pageRequest.page - 1).toString())
      .set('size', pageRequest.size.toString());

    return this.http.get<PageResponse<T>>(this.baseUrl, {
      params: params,
      headers: this.getHeaders()
    });
  }
}