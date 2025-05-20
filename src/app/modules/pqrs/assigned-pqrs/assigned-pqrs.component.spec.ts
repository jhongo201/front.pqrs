import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignedPqrsComponent } from './assigned-pqrs.component';

describe('AssignedPqrsComponent', () => {
  let component: AssignedPqrsComponent;
  let fixture: ComponentFixture<AssignedPqrsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignedPqrsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignedPqrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
