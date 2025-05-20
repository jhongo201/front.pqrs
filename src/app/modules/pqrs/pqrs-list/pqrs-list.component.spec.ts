import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PqrsListComponent } from './pqrs-list.component';

describe('PqrsListComponent', () => {
  let component: PqrsListComponent;
  let fixture: ComponentFixture<PqrsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PqrsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PqrsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
