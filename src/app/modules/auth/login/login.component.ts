import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { PublicHeaderComponent } from '../../../shared/public-header/public-header.component';
import { PublicFooterComponent } from '../../../shared/public-footer/public-footer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None  // ← AGREGAR ESTA LÍNEA
})
export class LoginComponent {
  credentials = {
    username: '',
    password: ''
  };
  error = '';
  isLoading = false;
  showPassword = false;
  
  // Propiedades para el efecto de loading
  showLoadingSteps = false;
  currentStep = 0;
  
  // Propiedades para validación visual
  usernameError = '';
  passwordError = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    // Limpiar errores previos
    this.usernameError = '';
    this.passwordError = '';
    
    // Validación de campos
    if (!this.credentials.username) {
      this.usernameError = 'El usuario es requerido';
    }
    
    if (!this.credentials.password) {
      this.passwordError = 'La contraseña es requerida';
    }

    if (!this.credentials.username || !this.credentials.password) {
      this.error = 'Por favor complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.showLoadingSteps = true;
    this.currentStep = 1;
    this.error = '';

    // Simular pasos del proceso
    setTimeout(() => this.currentStep = 2, 800);
    setTimeout(() => this.currentStep = 3, 1500);

    this.authService.login(this.credentials).subscribe({
      next: () => {
        setTimeout(() => {
          this.currentStep = 4;
          setTimeout(() => {
            this.isLoading = false;
            this.showLoadingSteps = false;
            this.currentStep = 0;
            this.router.navigate(['/dashboard']);
          }, 500);
        }, 500);
      },
      error: (error) => {
        this.isLoading = false;
        this.showLoadingSteps = false;
        this.currentStep = 0;
        
        // Manejo específico de errores
        if (error.status === 401) {
          this.error = 'Usuario o contraseña incorrectos';
        } else if (error.status === 403) {
          this.error = 'Cuenta inactiva. Por favor active su cuenta';
        } else if (error.status === 0) {
          this.error = 'Error de conexión. Verifique su internet';
        } else {
          this.error = error.error?.message || 'Error al iniciar sesión';
        }
        
        console.error('Error:', error);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Métodos para navegación
  goToRegister(): void {
    this.router.navigate(['/registro-externo']);
  }

  goToActivateUser(): void {
    this.router.navigate(['/activate-user']);
  }

  goToConsultaPqrs(): void {
    this.router.navigate(['/consulta-pqrs']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  // Métodos para validación en tiempo real
  validateUsername(): void {
    if (!this.credentials.username.trim()) {
      this.usernameError = 'El usuario es requerido';
    } else {
      this.usernameError = '';
    }
  }

  validatePassword(): void {
    if (!this.credentials.password) {
      this.passwordError = 'La contraseña es requerida';
    } else {
      this.passwordError = '';
    }
  }

  // Helper para verificar si el formulario es válido
  isFormValid(): boolean {
    return this.credentials.username.trim() !== '' && 
           this.credentials.password !== '' &&
           !this.usernameError && 
           !this.passwordError;
  }
}