import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPqrsComponent } from './my-pqrs.component';

describe('MyPqrsComponent', () => {
  let component: MyPqrsComponent;
  let fixture: ComponentFixture<MyPqrsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPqrsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPqrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
