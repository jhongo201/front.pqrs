import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnassignedPqrsComponent } from './unassigned-pqrs.component';

describe('UnassignedPqrsComponent', () => {
  let component: UnassignedPqrsComponent;
  let fixture: ComponentFixture<UnassignedPqrsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnassignedPqrsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnassignedPqrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
