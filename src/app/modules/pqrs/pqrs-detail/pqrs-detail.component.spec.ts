import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PqrsDetailComponent } from './pqrs-detail.component';

describe('PqrsDetailComponent', () => {
  let component: PqrsDetailComponent;
  let fixture: ComponentFixture<PqrsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PqrsDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PqrsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
