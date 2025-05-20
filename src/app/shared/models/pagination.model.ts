export interface PageRequest {
    page: number;
    size: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }
  
  export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }