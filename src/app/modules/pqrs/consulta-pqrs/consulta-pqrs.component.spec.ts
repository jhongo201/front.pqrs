import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaPqrsComponent } from './consulta-pqrs.component';

describe('ConsultaPqrsComponent', () => {
  let component: ConsultaPqrsComponent;
  let fixture: ComponentFixture<ConsultaPqrsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaPqrsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultaPqrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
