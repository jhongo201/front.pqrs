import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  message = '';
  errorMessage = '';
  emailSent = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid && !this.loading) {
      this.loading = true;
      this.errorMessage = '';
      this.message = '';

      const email = this.forgotPasswordForm.get('email')?.value;

      this.authService.solicitarRestablecimiento(email).subscribe({
        next: (response) => {
          this.loading = false;
          this.emailSent = true;
          this.message = 'Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.';
          console.log('✅ Solicitud de restablecimiento enviada exitosamente');
        },
        error: (error) => {
          this.loading = false;
          console.error('❌ Error al solicitar restablecimiento:', error);
          
          if (error.status === 404) {
            this.errorMessage = 'No se encontró una cuenta asociada a este correo electrónico.';
          } else if (error.status === 400) {
            this.errorMessage = error.error?.message || 'Datos inválidos. Verifica el correo electrónico.';
          } else if (error.status === 500) {
            this.errorMessage = 'Error interno del servidor. Intenta nuevamente más tarde.';
          } else {
            this.errorMessage = 'Error al procesar la solicitud. Intenta nuevamente.';
          }
        }
      });
    } else {
      // Marcar campos como tocados para mostrar errores de validación
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Método para obtener mensajes de error de validación
  getFieldError(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors['email']) {
        return 'Ingresa un correo electrónico válido';
      }
    }
    
    return '';
  }

  // Método para verificar si un campo tiene errores
  hasFieldError(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}
