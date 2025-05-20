import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePqrsPublicComponent } from './create-pqrs-public.component';

describe('CreatePqrsPublicComponent', () => {
  let component: CreatePqrsPublicComponent;
  let fixture: ComponentFixture<CreatePqrsPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePqrsPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePqrsPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
