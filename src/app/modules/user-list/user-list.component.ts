import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { User } from '../../shared/models/user.model';
import { Router } from '@angular/router';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/success-modal/success-modal.component';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
  encapsulation: ViewEncapsulation.None, // Agregar esta línea
  standalone: true,
  imports: [CommonModule, PaginationComponent, FormsModule, ReactiveFormsModule, ConfirmModalComponent, SuccessModalComponent]
})
export class UserListComponent implements OnInit, OnDestroy {
  // Datos principales
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  displayedUsers: User[] = [];
  roles: { id: number; nombre: string }[] = [];
  
  // Estados de carga y error
  loading = false;
  error = '';
  
  // Filtros y búsqueda
  searchTerm = '';
  selectedStatus: string = 'todos';
  
  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  isPaginated = true;
  
  // Ordenamiento
  sortConfig: SortConfig = { field: '', direction: 'asc' };
  
  // Modales
  showResendModal = false;
  showDeleteModal = false;
  showSuccessModal = false;
  showCreateLdapModal = false;
  selectedUser: User | null = null;
  
  // Mensajes de éxito/error
  successMessage = '';
  successTitle = '';
  modalType: 'success' | 'error' = 'success';
  
  // Formulario LDAP
  ldapForm!: FormGroup;
  
  // Observable para manejar subscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService, 
    private router: Router, 
    private fb: FormBuilder
  ) {
    this.initLdapForm();
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initLdapForm(): void {
    this.ldapForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      idRol: ['', Validators.required],
      estado: [true]
    });
  }

  private setupSearchDebounce(): void {
    // Implementar debounce para búsqueda si es necesario
    // Por ahora mantenemos la funcionalidad actual
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====
  loadUsers(): void {
    this.setLoadingState(true);

    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allUsers = data;
          this.filterUsers();
          this.setLoadingState(false);
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.error = 'Error al cargar la lista de usuarios';
          this.setLoadingState(false);
        }
      });
  }

  loadRoles(): void {
    this.userService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.roles = data
            .filter((rol: any) => rol.estado)
            .map((rol: any) => ({
              id: rol.idRol,
              nombre: rol.nombre
            }));
        },
        error: (err) => {
          console.error('Error al cargar los roles', err);
          this.showErrorMessage('No se pudieron cargar los roles.');
        }
      });
  }

  // ===== MÉTODOS DE FILTRADO Y ORDENAMIENTO =====
  filterUsers(): void {
    let results = [...this.allUsers];

    // Aplicar filtro de búsqueda
    if (this.searchTerm?.trim()) {
      const searchTermLower = this.searchTerm.toLowerCase();
      results = results.filter(user => 
        this.searchInUser(user, searchTermLower)
      );
    }

    // Aplicar filtro de estado
    if (this.selectedStatus !== 'todos') {
      const isActive = this.selectedStatus === 'activo';
      results = results.filter(user => user.estado === isActive);
    }

    // Aplicar ordenamiento
    if (this.sortConfig.field) {
      results = this.sortUsers(results);
    }

    this.filteredUsers = results;
    this.updatePagination();
    this.updateDisplayedUsers();
  }

  private searchInUser(user: User, searchTerm: string): boolean {
    const searchFields = [
      user.username,
      user.persona?.nombres || '',
      user.persona?.apellidos || '',
      user.persona?.email || '',
      user.rol?.nombre || '',
      this.getUserFullName(user)
    ];

    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm)
    );
  }

  sortBy(field: string): void {
    if (this.sortConfig.field === field) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig = { field, direction: 'asc' };
    }
    this.filterUsers();
  }

  private sortUsers(users: User[]): User[] {
    return users.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortConfig.field) {
        case 'username':
          aValue = a.username;
          bValue = b.username;
          break;
        case 'nombre':
          aValue = this.getUserFullName(a);
          bValue = this.getUserFullName(b);
          break;
        case 'email':
          aValue = a.persona?.email || '';
          bValue = b.persona?.email || '';
          break;
        case 'ultimoLogin':
          aValue = a.ultimoLogin ? new Date(a.ultimoLogin) : new Date(0);
          bValue = b.ultimoLogin ? new Date(b.ultimoLogin) : new Date(0);
          break;
        case 'fechaCreacion':
          aValue = a.fechaCreacion ? new Date(a.fechaCreacion) : new Date(0);
          bValue = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // ===== MÉTODOS DE PAGINACIÓN =====
  private updatePagination(): void {
    this.totalItems = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  updateDisplayedUsers(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredUsers.length);
    this.displayedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateDisplayedUsers();
  }

  // ===== MANEJADORES DE EVENTOS =====
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.currentPage = 1;
    this.filterUsers();
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus = select.value;
    this.currentPage = 1;
    this.filterUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'todos';
    this.sortConfig = { field: '', direction: 'asc' };
    this.currentPage = 1;
    this.filterUsers();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedStatus !== 'todos' || this.sortConfig.field);
  }

  // ===== NAVEGACIÓN =====
  viewDetails(id: number): void {
    if (id) {
      this.router.navigate(['usuarios', id]);
    }
  }

  editUser(userId: number): void {
    this.router.navigate([`/usuarios/${userId}`]);
  }

  goToActivation(username: string): void {
    this.router.navigate(['/activate-user'], {
      queryParams: { username }
    });
  }

  // ===== GESTIÓN DE USUARIOS =====
  deleteUser(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;

    this.setLoadingState(true);
    const deleteRequest = {
      username: this.selectedUser.username
    };

    this.userService.deleteUser(this.selectedUser.id, deleteRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsers();
          this.setLoadingState(false);
          this.showDeleteModal = false;
          this.selectedUser = null;
          this.showSuccessMessage('Usuario eliminado exitosamente');
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.showErrorMessage('Error al eliminar el usuario');
          this.setLoadingState(false);
          this.showDeleteModal = false;
          this.selectedUser = null;
        }
      });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  // ===== ACTIVACIÓN DE USUARIOS =====
  resendActivation(user: User): void {
    this.selectedUser = user;
    this.showResendModal = true;
  }

  confirmResend(): void {
    if (!this.selectedUser) return;

    this.setLoadingState(true);
    this.userService.resendActivationEmail(this.selectedUser.username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.setLoadingState(false);
          this.showResendModal = false;
          this.selectedUser = null;
          this.showSuccessMessage('Correo de activación enviado exitosamente');
        },
        error: (error) => {
          console.error('Error al enviar correo de activación:', error);
          this.setLoadingState(false);
          this.showResendModal = false;
          this.selectedUser = null;
          this.showErrorMessage('Error al enviar el correo de activación');
        }
      });
  }

  cancelResend(): void {
    this.showResendModal = false;
    this.selectedUser = null;
  }

  // ===== CREACIÓN DE USUARIO LDAP =====
  openCreateLdapModal(): void {
    this.ldapForm.reset({ estado: true });
    this.showCreateLdapModal = true;
  }

  createLdapUser(): void {
    if (!this.ldapForm.valid) {
      this.markFormGroupTouched(this.ldapForm);
      return;
    }

    const userData = {
      username: this.ldapForm.get('username')?.value,
      idRol: this.ldapForm.get('idRol')?.value,
      estado: this.ldapForm.get('estado')?.value
    };

    this.setLoadingState(true);
    this.userService.createLdapUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.setLoadingState(false);
          this.showCreateLdapModal = false;
          this.loadUsers();
          this.showSuccessMessage('Usuario LDAP creado exitosamente');
        },
        error: (error) => {
          console.error('Error creating LDAP user:', error);
          this.setLoadingState(false);
          this.showErrorMessage('Error al crear el usuario LDAP');
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // ===== MÉTODOS DE UTILIDAD =====
  getUserFullName(user: User): string {
    if (!user.persona) return 'Usuario LDAP';
    const nombres = user.persona.nombres || '';
    const apellidos = user.persona.apellidos || '';
    const fullName = `${nombres} ${apellidos}`.trim();
    return fullName || 'Sin nombre';
  }

  getActiveUsersCount(): number {
    return this.allUsers.filter(user => user.estado).length;
  }

  getInactiveUsersCount(): number {
    return this.allUsers.filter(user => !user.estado).length;
  }

  // ===== GESTIÓN DE ESTADOS =====
  private setLoadingState(loading: boolean): void {
    this.loading = loading;
    if (loading) {
      this.error = '';
    }
  }

  private showSuccessMessage(message: string): void {
    this.successTitle = 'Operación Exitosa';
    this.successMessage = message;
    this.modalType = 'success';
    this.showSuccessModal = true;
  }

  private showErrorMessage(message: string): void {
    this.successTitle = 'Error';
    this.successMessage = message;
    this.modalType = 'error';
    this.showSuccessModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  // ===== MÉTODOS MATEMÁTICOS PARA TEMPLATE =====
  Math = Math;

  // ===== VALIDACIONES DE FORMULARIO =====
  get ldapFormErrors(): { [key: string]: string } {
    const errors: { [key: string]: string } = {};
    
    const usernameControl = this.ldapForm.get('username');
    if (usernameControl?.touched && usernameControl?.errors) {
      if (usernameControl.errors['required']) {
        errors['username'] = 'El username es requerido';
      } else if (usernameControl.errors['minlength']) {
        errors['username'] = 'El username debe tener al menos 3 caracteres';
      }
    }

    const rolControl = this.ldapForm.get('idRol');
    if (rolControl?.touched && rolControl?.errors?.['required']) {
      errors['idRol'] = 'Debe seleccionar un rol';
    }

    return errors;
  }

  hasFormError(fieldName: string): boolean {
    const control = this.ldapForm.get(fieldName);
    return !!(control?.touched && control?.errors);
  }

  getFormError(fieldName: string): string {
    return this.ldapFormErrors[fieldName] || '';
  }

  // ===== MÉTODOS DE DESARROLLO/DEBUG =====
  private logUserStats(): void {
    console.log('=== ESTADÍSTICAS DE USUARIOS ===');
    console.log('Total usuarios:', this.allUsers.length);
    console.log('Usuarios activos:', this.getActiveUsersCount());
    console.log('Usuarios inactivos:', this.getInactiveUsersCount());
    console.log('Usuarios filtrados:', this.filteredUsers.length);
    console.log('Usuarios LDAP:', this.allUsers.filter(u => !u.persona).length);
    console.log('================================');
  }

  // ===== MÉTODOS LEGACY MANTENIDOS PARA COMPATIBILIDAD =====
  private loadUsersWithoutPagination(): void {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allUsers = data;
          this.setLoadingState(false);
          this.filterUsers();
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.error = 'Error al cargar la lista de usuarios';
          this.setLoadingState(false);
        }
      });
  }

  // ===== MÉTODOS PARA MANEJO DE ERRORES ESPECÍFICOS =====
  private handleApiError(error: any, defaultMessage: string): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return defaultMessage;
  }

  // ===== MÉTODOS PARA EXPORTACIÓN/IMPORTACIÓN (FUTURAS MEJORAS) =====
  exportUsers(): void {
    // Funcionalidad para exportar usuarios (implementar según necesidades)
    console.log('Exportando usuarios...');
    // TODO: Implementar exportación a CSV/Excel
  }

  importUsers(): void {
    // Funcionalidad para importar usuarios (implementar según necesidades)
    console.log('Importando usuarios...');
    // TODO: Implementar importación desde CSV/Excel
  }

  // ===== MÉTODOS PARA ACCESIBILIDAD =====
  getAriaLabel(action: string, user: User): string {
    switch (action) {
      case 'view':
        return `Ver detalles del usuario ${user.username}`;
      case 'edit':
        return `Editar usuario ${user.username}`;
      case 'delete':
        return `Eliminar usuario ${user.username}`;
      case 'activate':
        return `Activar usuario ${user.username}`;
      case 'resend':
        return `Reenviar correo de activación para ${user.username}`;
      default:
        return `Acción para usuario ${user.username}`;
    }
  }

  // ===== MÉTODOS PARA KEYBOARD NAVIGATION =====
  onKeyDown(event: KeyboardEvent, action: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }

  // ===== MÉTODOS PARA PERFORMANCE =====
  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  trackByRoleId(index: number, role: { id: number; nombre: string }): number {
    return role.id;
  }

  // ===== MÉTODOS PARA VALIDACIÓN DE DATOS =====
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isUserDataComplete(user: User): boolean {
    return !!(user.persona?.nombres && user.persona?.email && user.rol?.nombre);
  }

  // ===== MÉTODOS PARA CONFIGURACIÓN DINÁMICA =====
  updatePageSize(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.updatePagination();
    this.updateDisplayedUsers();
  }

  getPageSizeOptions(): number[] {
    return [5, 10, 25, 50, 100];
  }

  // ===== MÉTODOS FALTANTES PARA COMPATIBILIDAD =====
  
  // Método para manejar el ordenamiento visual en el template
  getSortIcon(field: string): string {
    if (this.sortConfig.field !== field) {
      return 'fa-sort';
    }
    return this.sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  // Método para obtener clase CSS del ordenamiento
  getSortClass(field: string): string {
    return this.sortConfig.field === field ? 'sorted' : '';
  }

  // Método para verificar si una columna está ordenada
  isSorted(field: string): boolean {
    return this.sortConfig.field === field;
  }

  // Método para formatear fechas de manera consistente
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  // Método para formatear fecha y hora
  formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  // Método para obtener iniciales del usuario
  getUserInitials(user: User): string {
    if (!user.persona) return 'AD';
    
    const nombres = user.persona.nombres || '';
    const apellidos = user.persona.apellidos || '';
    
    const inicialNombre = nombres.charAt(0).toUpperCase();
    const inicialApellido = apellidos.charAt(0).toUpperCase();
    
    return inicialNombre + inicialApellido || user.username.charAt(0).toUpperCase();
  }

  // Método para verificar si el email es válido y mostrarlo
  getDisplayEmail(user: User): string {
    const email = user.persona?.email;
    if (!email) return '';
    
    return this.isValidEmail(email) ? email : 'Email inválido';
  }

  // Método para obtener el color del avatar basado en el estado
  getAvatarColor(user: User): string {
    if (!user.estado) return '#6b7280'; // Gris para inactivos
    if (!user.persona) return '#06b6d4'; // Azul para LDAP
    return '#4f46e5'; // Púrpura para usuarios normales
  }

  // Método para obtener texto del rol con fallback
  getRoleDisplayText(user: User): string {
    return user.rol?.nombre || 'Sin rol asignado';
  }

  // Método para verificar si el usuario tiene permisos especiales
  hasSpecialPermissions(user: User): boolean {
    const specialRoles = ['Administrador', 'Super Usuario', 'Admin'];
    return specialRoles.includes(user.rol?.nombre || '');
  }

  // Método para obtener clase CSS basada en el rol
  getRoleClass(user: User): string {
    const roleName = user.rol?.nombre?.toLowerCase() || '';
    
    if (roleName.includes('admin')) return 'role-admin';
    if (roleName.includes('user')) return 'role-user';
    if (roleName.includes('guest')) return 'role-guest';
    
    return 'role-default';
  }

  // Método para verificar si se puede eliminar un usuario
  canDeleteUser(user: User): boolean {
    // No permitir eliminar administradores o usuarios con sesiones activas
    if (this.hasSpecialPermissions(user)) return false;
    if (user.ultimoLogin) {
      const lastLogin = new Date(user.ultimoLogin);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (lastLogin > oneDayAgo) return false; // Login en las últimas 24 horas
    }
    return true;
  }

  // Método para verificar si se puede editar un usuario
  canEditUser(user: User): boolean {
    return true; // Por ahora todos se pueden editar
  }

  // Método para obtener tooltip de botones
  getButtonTooltip(action: string, user: User): string {
    switch (action) {
      case 'delete':
        return this.canDeleteUser(user) 
          ? `Eliminar usuario ${user.username}` 
          : 'No se puede eliminar este usuario';
      case 'edit':
        return this.canEditUser(user) 
          ? `Editar usuario ${user.username}` 
          : 'No se puede editar este usuario';
      default:
        return this.getAriaLabel(action, user);
    }
  }

  // Método para manejar errores de carga de imágenes (si implementas avatares)
  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  // Método para generar URL de avatar (placeholder para futuras mejoras)
  getAvatarUrl(user: User): string {
    // Implementar integración con servicio de avatares si es necesario
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getUserFullName(user))}&background=random`;
  }

  // Método para manejar el double click en una fila
  onRowDoubleClick(user: User): void {
    this.viewDetails(user.id);
  }

  // Método para seleccionar/deseleccionar usuarios (para acciones en lote)
  selectedUsers: Set<number> = new Set();

  toggleUserSelection(userId: number): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.has(userId);
  }

  selectAllUsers(): void {
    this.displayedUsers.forEach(user => this.selectedUsers.add(user.id));
  }

  clearSelection(): void {
    this.selectedUsers.clear();
  }

  get hasSelectedUsers(): boolean {
    return this.selectedUsers.size > 0;
  }

  get selectedUsersCount(): number {
    return this.selectedUsers.size;
  }

  // Método para acciones en lote
  bulkDeleteUsers(): void {
    if (this.selectedUsers.size === 0) return;
    
    // Implementar lógica de eliminación en lote
    console.log('Eliminando usuarios:', Array.from(this.selectedUsers));
  }

  bulkActivateUsers(): void {
    if (this.selectedUsers.size === 0) return;
    
    // Implementar lógica de activación en lote
    console.log('Activando usuarios:', Array.from(this.selectedUsers));
  }

  bulkDeactivateUsers(): void {
    if (this.selectedUsers.size === 0) return;
    
    // Implementar lógica de desactivación en lote
    console.log('Desactivando usuarios:', Array.from(this.selectedUsers));
  }

  // ===== CLEANUP Y OPTIMIZACIÓN =====
  refreshData(): void {
    this.clearFilters();
    this.clearSelection();
    this.loadUsers();
    this.loadRoles();
  }

  private resetComponentState(): void {
    this.allUsers = [];
    this.filteredUsers = [];
    this.displayedUsers = [];
    this.currentPage = 1;
    this.error = '';
    this.searchTerm = '';
    this.selectedStatus = 'todos';
    this.sortConfig = { field: '', direction: 'asc' };
    this.clearSelection();
  }
}