// activate-user.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';
import { PublicFooterComponent } from '../../shared/public-footer/public-footer.component';

@Component({
  selector: 'app-activate-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './activate-user.component.html',
  styleUrls: ['./activate-user.component.css'],
})
export class ActivateUserComponent {
  activationForm: FormGroup;
  loading = false;
  responseMessage: string = '';
  isSuccess: boolean = false;
  showResponse = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.activationForm = this.fb.group({
      token: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.activationForm.valid) {
      this.loading = true;
      const token = this.activationForm.value.token;
      const apiUrl = `${environment.apiUrl}/usuarios/activar/${token}`;

      this.http.get(apiUrl).subscribe({
        next: (response: any) => {
          this.responseMessage = response.message || 'Activación exitosa';
          this.isSuccess = true;
          this.showResponse = true;
          this.loading = false;
        },
        error: (error) => {
          this.responseMessage = error.error.message || 'Activación fallida';
          this.isSuccess = false;
          this.showResponse = true;
          this.loading = false;
        },
      });
    }
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
}