import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PqrsService } from '../../../core/services/pqrs.service';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PublicHeaderComponent } from '../../../shared/public-header/public-header.component';
import { PublicFooterComponent } from '../../../shared/public-footer/public-footer.component';


interface ConsultaReciente {
  numeroRadicado: string;
  fecha: Date;
}

@Component({
  selector: 'app-consulta-pqrs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './consulta-pqrs.component.html',
  styleUrls: ['./consulta-pqrs.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ConsultaPqrsComponent {
  consultaForm!: FormGroup;
  loading = false;
  error = '';
  pqrsEncontrado: any = null;
  esConsultaPublica = true; // Toggle entre consulta pública y por radicado
  mostrarSeguimientos = false;
  consultasRecientes: ConsultaReciente[] = [];
  tokenFromUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private pqrsService: PqrsService,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.consultaForm = this.fb.group({
      numeroRadicado: ['', [Validators.required, Validators.minLength(5)]],
      tokenUuid: ['', this.esConsultaPublica ? [Validators.required] : []]
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const radicado = params.get('radicado');
      const token = params.get('token');
      
      if (radicado && token) {
        // URL con formato: /consulta-pqrs/PQRS-2025-07-0011/token

        this.tokenFromUrl = token;
        this.consultaForm.patchValue({
          numeroRadicado: radicado,
          tokenUuid: token
        });
        this.onSubmit();
      } else if (token) {
        // URL con formato: /consulta-pqrs/token (formato anterior)
        this.tokenFromUrl = token;
        this.consultarPqrsPorToken(token);
      }
    });
  }

  private mostrarPqrsPorToken(token: string) {
    this.loading = true;
    this.error = '';
    this.pqrsEncontrado = null;

    // Primero intentamos obtener el PQRS usando el token
    // El backend debería manejar la lógica para encontrar el PQRS correcto
    this.pqrsService.consultarPqrsPublico('', token).subscribe({
      next: (response) => {
        this.pqrsEncontrado = response;
        if (response.numeroRadicado) {
          this.consultaForm.patchValue({
            numeroRadicado: response.numeroRadicado,
            tokenUuid: token
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al consultar PQRS:', error);
        this.error = error.error?.mensaje || 'No se encontró el PQRS solicitado';
        this.loading = false;
      }
    });
  }

  private consultarPqrsConToken(radicado: string, token: string) {
    this.loading = true;
    this.error = '';
    
    this.pqrsService.consultarPqrsPublico(radicado, token).subscribe({
      next: (response) => {
        this.pqrsEncontrado = response;
        this.loading = false;
        // Actualizar el formulario con los datos
        this.consultaForm.patchValue({
          numeroRadicado: radicado,
          tokenUuid: token
        });
      },
      error: (error) => {
        console.error('Error al consultar PQRS:', error);
        this.error = error.error?.mensaje || 'No se encontró el PQRS solicitado';
        this.loading = false;
      }
    });
  }

  private consultarPqrsPorToken(token: string) {
    this.loading = true;
    this.error = '';
    this.pqrsEncontrado = null;
  
    this.pqrsService.consultarPqrsPorToken(token).subscribe({
      next: (response) => {
        this.pqrsEncontrado = response;
        if (response.numeroRadicado) {
          this.consultaForm.patchValue({
            numeroRadicado: response.numeroRadicado,
            tokenUuid: token
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al consultar PQRS:', error);
        this.error = error.error?.mensaje || 'No se encontró el PQRS solicitado';
        this.loading = false;
      }
    });
  }

  private cargarConsultasRecientes() {
    const consultasGuardadas = localStorage.getItem('consultasRecientes');
    if (consultasGuardadas) {
      this.consultasRecientes = JSON.parse(consultasGuardadas);
    }
  }

  private guardarConsulta(numeroRadicado: string) {
    const nuevaConsulta: ConsultaReciente = {
      numeroRadicado,
      fecha: new Date()
    };
    
    this.consultasRecientes.unshift(nuevaConsulta);
    // Mantener solo las últimas 5 consultas
    this.consultasRecientes = this.consultasRecientes.slice(0, 5);
    
    localStorage.setItem('consultasRecientes', JSON.stringify(this.consultasRecientes));
  }

  toggleSeguimientos(): void {
    this.mostrarSeguimientos = !this.mostrarSeguimientos;
  }

  getFileUrl(nombreArchivo: string): string {
    return this.pqrsService.getFileUrl(nombreArchivo);
  }

  toggleTipoConsulta(): void {
    this.esConsultaPublica = !this.esConsultaPublica;
    this.error = '';
    this.pqrsEncontrado = null;
    
    if (this.esConsultaPublica) {
      this.consultaForm.get('tokenUuid')?.setValidators([Validators.required]);
    } else {
      this.consultaForm.get('tokenUuid')?.clearValidators();
    }
    
    this.consultaForm.get('tokenUuid')?.updateValueAndValidity();
    this.consultaForm.reset();
  }

  onSubmit(): void {
    if (this.consultaForm.valid) {
      this.loading = true;
      this.error = '';
      this.pqrsEncontrado = null;

      const { numeroRadicado, tokenUuid } = this.consultaForm.value;
      const token = tokenUuid || this.tokenFromUrl;

      if (this.esConsultaPublica && token) {
        // Consulta pública con radicado y token
        this.pqrsService.consultarPqrsPublico(numeroRadicado, token).subscribe({
          next: (response) => {
            this.pqrsEncontrado = response;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error al consultar PQRS público:', error);
            this.loading = false;
            
            switch (error.status) {
              case 403:
                this.error = 'Acceso denegado. Verifique que el radicado y token sean correctos.';
                break;
              case 404:
                this.error = 'No se encontró el PQRS con el radicado y token proporcionados.';
                break;
              case 500:
                this.error = 'Error interno del servidor. Intente nuevamente más tarde.';
                break;
              default:
                this.error = error.error?.error || error.error?.message || 'Error al consultar el PQRS. Verifique los datos e intente nuevamente.';
            }
          }
        });
      } else {
        // Consulta por radicado sin token
        this.pqrsService.consultarPorRadicado(numeroRadicado).subscribe({
          next: (response) => {
            this.pqrsEncontrado = response;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error en consulta por radicado:', error);
            this.loading = false;
            
            switch (error.status) {
              case 403:
                this.error = 'Acceso denegado. El PQRS no está disponible para consulta pública o requiere token de acceso.';
                break;
              case 404:
                this.error = 'No se encontró el PQRS con el radicado proporcionado.';
                break;
              case 500:
                this.error = 'Error interno del servidor. Intente nuevamente más tarde.';
                break;
              default:
                this.error = error.error?.error || error.error?.message || 'Error al consultar el PQRS. Verifique el radicado e intente nuevamente.';
            }
          }
        });
      }
    } else {
      this.marcarCamposComoTocados();
    }
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.consultaForm.controls).forEach(key => {
      const control = this.consultaForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMensaje(controlName: string): string {
    const control = this.consultaForm.get(controlName);
    if (control?.hasError('required')) {
      return `El campo ${controlName === 'numeroRadicado' ? 'número de radicado' : 'token'} es requerido`;
    }
    if (control?.hasError('minlength')) {
      return `El número de radicado debe tener al menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
}
