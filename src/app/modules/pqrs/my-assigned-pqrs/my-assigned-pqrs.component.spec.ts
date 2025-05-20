import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAssignedPqrsComponent } from './my-assigned-pqrs.component';

describe('MyAssignedPqrsComponent', () => {
  let component: MyAssignedPqrsComponent;
  let fixture: ComponentFixture<MyAssignedPqrsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyAssignedPqrsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyAssignedPqrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
