import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LdapUser, LdapUserCreate, LdapUserUpdate, Role } from '../../shared/models/ldap-user.model';
import { UserService } from '../../core/services/user.service';
import { AreaService } from '../../core/services/area.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/success-modal/success-modal.component';

@Component({
  selector: 'app-ldap-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmModalComponent],  
  templateUrl: './ldap-users.component.html',
  styleUrl: './ldap-users.component.css'
})
export class LdapUsersComponent implements OnInit {
  users: LdapUser[] = [];
  roles: { id: number; nombre: string }[] = [];
  areas: { id: number; nombre: string }[] = [];
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedUser: LdapUser | null = null;
  loading = false;

  createForm: FormGroup;
  editForm: FormGroup;
  createFormLdap: FormGroup;

  showConnectionErrorModal = false;
  connectionErrorMessage = '';

  constructor(
    private userService: UserService,
    private areaService: AreaService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      username: ['', Validators.required],
      idRol: [null, Validators.required],
      estado: [true],
      primerNombre: ['', Validators.required],
      otrosNombres: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      idArea: [null, Validators.required]
    });

    this.editForm = this.fb.group({
      idRol: [null, Validators.required],
      estado: [false]
    });

    this.createFormLdap = this.fb.group({
      username: ['', Validators.required],
      idRol: [null, Validators.required],
      estado: [true]
    });

  }

  ngOnInit() {
    console.log('LdapUsersComponent initialized');
    this.loadUsers();
    this.loadRoles();
    this.loadAreas();
  }

  loadUsers() {
    console.log('Loading LDAP users...');
    this.loading = true;
    this.userService.getLdapUsers().subscribe({
      next: (data) => {
        console.log('LDAP users loaded:', data);
        this.users = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading LDAP users:', error);
        this.loading = false;
      }
    });
  }

  // Cargar roles (this.roles = data)
  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (data: any) => {
        // Asegúrate que la API devuelva empresas con las claves idEmpresa y nombre
        // Mapea los datos y cambia 'idEmpresa' por 'id'
        this.roles = data
        // Filtra los roles activos antes de mapearlas
        .filter((rol: any) => rol.estado)
        .map((rol: any) => ({
          id: rol.idRol,   // Ajuste en las claves
          nombre: rol.nombre
        }));
        console.log('Roles cargados:', this.roles); // Verifica los datos cargados
      },error: (err) => {
        console.error('Error al cargar los roles', err);
        alert('No se pudieron cargar los roles.');
      },
    });
  }

  // Cargar áreas
  loadAreas(): void {
    this.areaService.listarAreas().subscribe({
      next: (data: any) => {
        this.areas = data
        .filter((area: any) => area.estado)
        .map((area: any) => ({
          id: area.idArea,
          nombre: area.nombre
        }));
        console.log('Áreas cargadas:', this.areas);
      },
      error: (err) => {
        console.error('Error al cargar las áreas', err);
        alert('No se pudieron cargar las áreas.');
      }
    });
  }

  openCreateModal() {
    this.createForm.reset({ estado: true });
    this.showCreateModal = true;
  }

  openEditModal(user: LdapUser) {
    this.selectedUser = user;
    this.editForm.patchValue({
      idRol: user.rol.id,
      estado: user.estado
    });
    this.showEditModal = true;
  }

  openDeleteModal(user: LdapUser) {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  onCreateSubmit() {
    if (this.createForm.valid) {
      this.loading = true;
      const userData: LdapUserCreate = {
        username: this.createForm.get('username')?.value,
        idRol: this.createForm.get('idRol')?.value,
        estado: this.createForm.get('estado')?.value,
        primerNombre: this.createForm.get('primerNombre')?.value,
        otrosNombres: this.createForm.get('otrosNombres')?.value || null,
        primerApellido: this.createForm.get('primerApellido')?.value,
        segundoApellido: this.createForm.get('segundoApellido')?.value || null,
        idArea: this.createForm.get('idArea')?.value
      };

      console.log('los datos para crear el usuario son:  username ->' + this.createForm.get('username')?.value);
      console.log('los datos para crear el usuario son: idRol ->' + this.createForm.get('idRol')?.value);
      console.log('los datos para crear el usuario son: estado ->' + this.createForm.get('estado')?.value);
      this.userService.createLdapUser(userData).subscribe({
        next: () => {
          this.showCreateModal = false;
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.loading = false;
        }
      });
    }
  }

  onEditSubmit() {
    if (this.editForm.valid && this.selectedUser) {
      this.loading = true;
      const updateData: LdapUserUpdate = {
        idUsuario: this.selectedUser.id,
        idRol: this.editForm.get('idRol')?.value,
        estado: this.editForm.get('estado')?.value
      };

      this.userService.updateLdapUser(this.selectedUser.id, updateData).subscribe({
        next: () => {
          this.showEditModal = false;
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.loading = false;
        }
      });
    }
  }

  onDelete() {
    if (this.selectedUser) {
      this.loading = true;
      this.userService.deleteLdapUser(this.selectedUser.id).subscribe({
        next: () => {
          this.showDeleteModal = false;
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.loading = false;
        }
      });
    }
  }
}