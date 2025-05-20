import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PqrsReportsComponent } from './pqrs-reports.component';

describe('PqrsReportsComponent', () => {
  let component: PqrsReportsComponent;
  let fixture: ComponentFixture<PqrsReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PqrsReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PqrsReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
