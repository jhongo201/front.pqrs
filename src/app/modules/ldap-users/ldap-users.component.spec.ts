import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LdapUsersComponent } from './ldap-users.component';

describe('LdapUsersComponent', () => {
  let component: LdapUsersComponent;
  let fixture: ComponentFixture<LdapUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LdapUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LdapUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
