import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePqrsInternalComponent } from './create-pqrs-internal.component';

describe('CreatePqrsInternalComponent', () => {
  let component: CreatePqrsInternalComponent;
  let fixture: ComponentFixture<CreatePqrsInternalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePqrsInternalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePqrsInternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
