import { TestBed } from '@angular/core/testing';

import { BasePaginatedService } from './base-paginated.service';

describe('BasePaginatedService', () => {
  let service: BasePaginatedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BasePaginatedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
