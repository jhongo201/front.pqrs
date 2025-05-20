import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { User } from '../../shared/models/user.model';
import { Router } from '@angular/router';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/success-modal/success-modal.component';


@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
  standalone: true,
  imports: [CommonModule, PaginationComponent, FormsModule, ReactiveFormsModule, ConfirmModalComponent, SuccessModalComponent]
})
export class UserListComponent implements OnInit {
  allUsers: User[] = []; // Lista completa de usuarios
  filteredUsers: User[] = []; // Usuarios después del filtro
  displayedUsers: User[] = []; // Usuarios mostrados en la página actual
  roles: { id: number; nombre: string }[] = [];
  loading = false;
  error = '';
  searchTerm = ''; // Para el término de búsqueda
  selectedStatus: string = 'todos'; // Para el filtro de estado

  
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  isPaginated = true; // Flag para controlar si usamos paginación


  showResendModal = false;
  showDeleteModal = false;
  selectedUser: User | null = null;

  showSuccessModal = false;
  successMessage = '';
  successTitle = '';
  modalType: 'success' | 'error' = 'success';

  showCreateLdapModal = false;
  ldapForm: FormGroup;


  constructor(private userService: UserService, private router: Router, private fb: FormBuilder) {

    this.ldapForm = this.fb.group({
      username: ['', Validators.required],
      idRol: ['', Validators.required],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles(); // Cargar los roles al inicializar
  }

  editUser(userId: number): void {
    this.router.navigate([`/usuarios/${userId}`]);
  }

  deleteUser(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;

    this.loading = true;
    const deleteRequest = {
      username: this.selectedUser.username
    };

    this.userService.deleteUser(this.selectedUser.id, deleteRequest).subscribe({
      next: () => {
        this.loadUsers();
        this.loading = false;
        this.showDeleteModal = false;
        this.selectedUser = null;
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar el usuario');
        this.loading = false;
        this.showDeleteModal = false;
        this.selectedUser = null;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  loadUsers(): void {
    this.loading = true;

    if (this.isPaginated) {
      // Intenta usar paginación
      this.userService.getUsers().subscribe({
        next: (data) => {
          this.allUsers = data; // Guardamos todos los usuarios
          this.filterUsers(); // Aplicamos el filtro inicial
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.error = 'Error al cargar la lista de usuarios';
          // Si falla la paginación, intentamos sin ella
          this.loadUsersWithoutPagination();
          this.loading = false;
        }
      });
    } else {
      this.loadUsersWithoutPagination();
    }

    
  }

  filterUsers(): void {
    let results = [...this.allUsers];

    // Aplicar filtro de búsqueda
    if (this.searchTerm?.trim()) {
      const searchTermLower = this.searchTerm.toLowerCase();
      results = results.filter(user => 
        user.username.toLowerCase().includes(searchTermLower) ||
        (user.persona?.nombres || '').toLowerCase().includes(searchTermLower) ||
        (user.persona?.apellidos || '').toLowerCase().includes(searchTermLower) ||
        (user.persona?.email || '').toLowerCase().includes(searchTermLower) ||
        (user.rol?.nombre || '').toLowerCase().includes(searchTermLower)
      );
    }

    // Aplicar filtro de estado
    if (this.selectedStatus !== 'todos') {
      const isActive = this.selectedStatus === 'activo';
      results = results.filter(user => user.estado === isActive);
    }

    // Actualizar los resultados filtrados
    this.filteredUsers = results;
    this.totalItems = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // Ajustar la página actual si es necesario
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    this.updateDisplayedUsers();
}

  updateDisplayedUsers(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredUsers.length);
    this.displayedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus = select.value;
    this.currentPage = 1; // Volver a la primera página al cambiar el filtro
    this.filterUsers();
  }
  

  private loadUsersWithoutPagination(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        console.log('Datos sin paginar:', data);
        this.allUsers = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.error = 'Error al cargar la lista de usuarios';
        this.loading = false;
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.currentPage = 1; // Reiniciar a la primera página al buscar
    this.filterUsers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateDisplayedUsers();
  }

  viewDetails(id: number): void {
    console.log('Navegando a usuario con ID:', id);
    if (id) {
      // Navegamos a la ruta anidada correcta
      this.router.navigate(['usuarios', id]);
    }
  }

  getUserFullName(user: User): string {
    if (!user.persona) return 'Usuario AD';
    return `${user.persona.nombres || ''} ${user.persona.apellidos || ''}`.trim() || 'Sin nombre';
  }

  // user-list.component.ts
  resendActivation(user: User): void {
    this.selectedUser = user;
    this.showResendModal = true;
  }

  confirmResend(): void {
    if (!this.selectedUser) return;

    this.loading = true;
    this.userService.resendActivationEmail(this.selectedUser.username).subscribe({
      next: () => {
        this.loading = false;
        this.showResendModal = false;
        this.selectedUser = null;
        
        // Mostrar modal de éxito
        this.successTitle = 'Correo Enviado';
        this.successMessage = 'El correo de activación ha sido enviado exitosamente.';
        this.modalType = 'success';
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('Error al enviar correo de activación:', error);
        this.loading = false;
        this.showResendModal = false;
        this.selectedUser = null;

        // Mostrar modal de error
        this.successTitle = 'Error';
        this.successMessage = 'Ha ocurrido un error al enviar el correo de activación.';
        this.modalType = 'error';
        this.showSuccessModal = true;
      }
    });
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  cancelResend(): void {
    this.showResendModal = false;
    this.selectedUser = null;
  }

  goToActivation(username: string): void {
    // Navegar a la página de activación con el username como parámetro
    this.router.navigate(['/activate-user'], {
      queryParams: { username }
    });
  }

  openCreateLdapModal() {
    this.ldapForm.reset({ estado: true });
    this.showCreateLdapModal = true;
  }

  createLdapUser() {
    if (this.ldapForm.valid) {
      const userData = {
        username: this.ldapForm.get('username')?.value,
        idRol: this.ldapForm.get('idRol')?.value,
        estado: this.ldapForm.get('estado')?.value
      };

      this.loading = true;
      this.userService.createLdapUser(userData).subscribe({
        next: () => {
          this.loading = false;
          this.showCreateLdapModal = false;
          this.loadUsers(); // Recargar la lista de usuarios
        },
        error: (error) => {
          console.error('Error creating LDAP user:', error);
          this.loading = false;
        }
      });
    }
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
        console.log('Areas cargadas:', this.roles); // Verifica los datos cargados
      },error: (err) => {
        console.error('Error al cargar los roles', err);
        alert('No se pudieron cargar los roles.');
      },
    });
  }

}