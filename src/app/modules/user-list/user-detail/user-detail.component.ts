import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';  // Asegúrate de importar CommonModule
import { UserService } from '../../../core/services/user.service';
import { UpdateUserRequest, User, UserDetail } from '../../../shared/models/user.model';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css'],
  standalone: true,  // Agregar esta línea
   imports: [CommonModule, RouterLink, FormsModule]  // Importa CommonModule para usar *ngFor y otras directivas
})
export class UserDetailComponent implements OnInit {
  user: User | undefined;
  userDetail: UserDetail | undefined;

  isEditing = false;
  updateForm: UpdateUserRequest = {
    username: '',
    password: ''
  };
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) { }

  onDelete() {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      const userId = Number(this.route.snapshot.paramMap.get('id'));
      const deleteRequest = {
        username: this.userDetail?.username || ''
      };

      this.userService.deleteUser(userId, deleteRequest).subscribe({
        next: () => {
          alert('Usuario eliminado con éxito');
          this.router.navigate(['/usuarios']);
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          alert('Error al eliminar el usuario');
        }
      });
    }
  }

  startEditing() {
    this.isEditing = true;
    this.updateForm.username = this.userDetail?.username || '';
    this.updateForm.password = '';
  }

  cancelEditing() {
    this.isEditing = false;
  }

  onUpdate() {
    if (!this.updateForm.username || !this.updateForm.password) {
      alert('Por favor complete todos los campos');
      return;
    }

    const userId = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.updateUser(userId, this.updateForm).subscribe({
      next: () => {
        alert('Usuario actualizado con éxito');
        this.isEditing = false;
        // Recargar los detalles del usuario
        this.ngOnInit();
      },
      error: (error) => {
        console.error('Error al actualizar usuario:', error);
        alert('Error al actualizar el usuario');
      }
    });
  }

  ngOnInit(): void {
    // Obtener el ID del usuario desde la ruta
    const userId = Number(this.route.snapshot.paramMap.get('id'));
    
    // Obtener los detalles del usuario
    this.userService.getUserDetailById(userId).subscribe({
      next: (data) => {
        this.userDetail  = data;
        console.log('Usuario cargado:', data); // Para depuración
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
      }
    });
  }
}
