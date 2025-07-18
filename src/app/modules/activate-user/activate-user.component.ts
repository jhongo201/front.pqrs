import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';
import { PublicFooterComponent } from '../../shared/public-footer/public-footer.component';

@Component({
  selector: 'app-activate-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './activate-user.component.html',
  styleUrls: ['./activate-user.component.css'],
  encapsulation: ViewEncapsulation.None  // ← AGREGAR ESTA LÍNEA
})
export class ActivateUserComponent {
  activationForm: FormGroup;
  loading = false;
  responseMessage: string = '';
  isSuccess: boolean = false;
  showResponse = false;
  // Agregar estas propiedades para el efecto de loading
  showLoadingSteps = false;
  currentStep = 0;

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private router: Router  // Agregar Router
  ) {
    this.activationForm = this.fb.group({
      token: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.activationForm.valid) {
      this.loading = true;
      this.showLoadingSteps = true;
      this.currentStep = 1;
      
      const token = this.activationForm.value.token;
      const apiUrl = `${environment.apiUrl}/usuarios/activar/${token}`;

      // Simular pasos del proceso
      setTimeout(() => this.currentStep = 2, 500);

      this.http.get(apiUrl).subscribe({
        next: (response: any) => {
          setTimeout(() => {
            this.currentStep = 3;
            setTimeout(() => {
              this.loading = false;
              this.showLoadingSteps = false;
              this.currentStep = 0;
              
              this.responseMessage = response.message || '¡Cuenta activada exitosamente!';
              this.isSuccess = true;
              this.showResponse = true;
              
              // Redirigir al login después de 3 segundos
              setTimeout(() => {
                this.router.navigate(['/login']);
              }, 3000);
            }, 800);
          }, 500);
        },
        error: (error) => {
          this.loading = false;
          this.showLoadingSteps = false;
          this.currentStep = 0;
          
          this.responseMessage = error.error?.message || 'Error al activar la cuenta. Verifique el token e intente nuevamente.';
          this.isSuccess = false;
          this.showResponse = true;
        },
      });
    }
  }

  // Método para ir al login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Método para ir al registro
  goToRegister(): void {
    this.router.navigate(['/registro-externo']);
  }

  // Helper para los errores del formulario
  getTokenError(): string {
    const control = this.activationForm.get('token');
    if (control?.hasError('required')) {
      return 'El token es requerido';
    }
    if (control?.hasError('minlength')) {
      return 'El token debe tener al menos 6 caracteres';
    }
    return '';
  }

  // Helper para validar si el campo es inválido
  isFieldInvalid(fieldName: string): boolean {
    const field = this.activationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}