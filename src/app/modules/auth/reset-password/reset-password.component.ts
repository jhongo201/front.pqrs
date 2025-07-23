import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  loading = false;
  validatingToken = true;
  tokenValid = false;
  message = '';
  errorMessage = '';
  token = '';
  passwordReset = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      nuevaPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmarPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Obtener el token de la URL
    this.route.params.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validarToken();
      } else {
        this.validatingToken = false;
        this.tokenValid = false;
        this.errorMessage = 'Token de restablecimiento no válido.';
      }
    });
  }

  validarToken(): void {
    this.validatingToken = true;
    this.authService.validarToken(this.token).subscribe({
      next: (response) => {
        this.validatingToken = false;
        this.tokenValid = true;
        console.log('✅ Token válido:', response);
      },
      error: (error) => {
        this.validatingToken = false;
        this.tokenValid = false;
        console.error('❌ Error al validar token:', error);
        
        if (error.status === 404) {
          this.errorMessage = 'El enlace de restablecimiento no es válido o ha expirado.';
        } else if (error.status === 410) {
          this.errorMessage = 'Este enlace de restablecimiento ya fue utilizado.';
        } else {
          this.errorMessage = 'Error al validar el enlace. Intenta solicitar un nuevo restablecimiento.';
        }
      }
    });
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && !this.loading && this.tokenValid) {
      this.loading = true;
      this.errorMessage = '';
      this.message = '';

      const nuevaPassword = this.resetPasswordForm.get('nuevaPassword')?.value;
      const confirmarPassword = this.resetPasswordForm.get('confirmarPassword')?.value;

      this.authService.restablecerPassword(this.token, nuevaPassword, confirmarPassword).subscribe({
        next: (response) => {
          this.loading = false;
          this.passwordReset = true;
          this.message = 'Tu contraseña ha sido restablecida exitosamente.';
          console.log('✅ Contraseña restablecida exitosamente');
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.loading = false;
          console.error('❌ Error al restablecer contraseña:', error);
          
          if (error.status === 400) {
            this.errorMessage = error.error?.message || 'Datos inválidos. Verifica que las contraseñas coincidan.';
          } else if (error.status === 404) {
            this.errorMessage = 'El enlace de restablecimiento no es válido o ha expirado.';
          } else if (error.status === 410) {
            this.errorMessage = 'Este enlace de restablecimiento ya fue utilizado.';
          } else {
            this.errorMessage = 'Error al restablecer la contraseña. Intenta nuevamente.';
          }
        }
      });
    } else {
      // Marcar campos como tocados para mostrar errores de validación
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  requestNewReset(): void {
    this.router.navigate(['/forgot-password']);
  }

  // Validador personalizado para la fortaleza de la contraseña
  passwordStrengthValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.value;
    if (!password) return null;

    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const valid = hasNumber && hasUpper && hasLower && hasSpecial;
    
    if (!valid) {
      return { 'passwordStrength': true };
    }
    
    return null;
  }

  // Validador para verificar que las contraseñas coincidan
  passwordMatchValidator(form: AbstractControl): {[key: string]: any} | null {
    const password = form.get('nuevaPassword');
    const confirmPassword = form.get('confirmarPassword');

    if (!password || !confirmPassword) return null;

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ 'passwordMismatch': true });
      return { 'passwordMismatch': true };
    } else {
      // Limpiar el error si las contraseñas coinciden
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }

    return null;
  }

  // Método para obtener mensajes de error de validación
  getFieldError(fieldName: string): string {
    const field = this.resetPasswordForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 8 caracteres';
      }
      if (field.errors['passwordStrength']) {
        return 'La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial';
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    
    return '';
  }

  // Método para verificar si un campo tiene errores
  hasFieldError(fieldName: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Método para obtener la fortaleza de la contraseña
  getPasswordStrength(): string {
    const password = this.resetPasswordForm.get('nuevaPassword')?.value || '';
    
    if (password.length === 0) return '';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }
}
