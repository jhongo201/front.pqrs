import { Component, OnInit, Input } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicHeaderComponent } from '../../../shared/public-header/public-header.component';
import { PublicFooterComponent } from '../../../shared/public-footer/public-footer.component';
import { HeaderDashboardComponent } from '../../../shared/header-dashboard/header-dashboard.component';


// Primero definimos las interfaces
interface ValidationMessages {
  [key: string]: string;
}

interface FieldValidation {
  validators: Array<(control: AbstractControl) => ValidationErrors | null>;
  messages: ValidationMessages;
}

interface FormValidations {
  [key: string]: FieldValidation;
}


@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, PublicHeaderComponent, PublicFooterComponent, HeaderDashboardComponent],
})
export class CreateUserComponent implements OnInit {
  
  @Input() isExternalUser: boolean = false; // Para controlar el tipo de registro


  userForm!: FormGroup;  // Agregar el signo de exclamación
  areas: { id: number; nombre: string }[] = [];
  roles: { id: number; nombre: string }[] = [];
  empresas: { id: number; nombre: string }[] = [];
  errorMessage: string = ''; // Mensaje de error
  loading: boolean = false; // Agregamos esta propiedad
  successMessage: string = '';

  // Agregar propiedades para la visibilidad de la contraseña
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Propiedades para la fortaleza de la contraseña
  passwordMeetsLength = false;
  passwordHasUpper = false;
  passwordHasLower = false;
  passwordHasNumber = false;
  passwordHasSpecial = false;

  // Valores predeterminados para usuarios externos
  //territorial => 4
  //Direccion => 5
  private readonly EXTERNAL_USER_DEFAULTS = {
    idArea: 1006,
    idEmpresa: 6,
    idRol: 2
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute // Agregar esto
  ) {
    // Obtener el valor de isExternalUser de la ruta
    this.route.data.subscribe(data => {
      this.isExternalUser = data['isExternalUser'] || false;
      console.log('Es usuario externo:', this.isExternalUser);
      this.initForm(); // Inicializar el formulario después de saber el tipo de usuario
    });
  }

  private initForm(): void {
    const validations = this.getBaseValidations();
    const baseForm: { [key: string]: any } = {};

    // Crear el formulario base con las validaciones
    Object.keys(validations).forEach(key => {
      baseForm[key] = ['', validations[key].validators];
    });

    if (!this.isExternalUser) {
      // Si es usuario interno, agregar campos adicionales
      this.userForm = this.fb.group({
        ...baseForm,
        idArea: ['', [Validators.required]],
        idEmpresa: ['', [Validators.required]],
        idRol: ['', [Validators.required]]
      });
    } else {
      // Si es usuario externo, usar solo el formulario base
      this.userForm = this.fb.group(baseForm);
    }
  }

  ngOnInit(): void {

    // Solo cargar datos adicionales si NO es usuario externo
    if (!this.isExternalUser) {
      this.loadInitialData();
    }

    // Suscribirse a cambios en el campo de contraseña
    this.userForm.get('password')?.valueChanges.subscribe(value => {
      if (value) {
        this.checkPasswordStrength(value);
      }
    });

  }

  private loadInitialData(): void {
    this.loadCompanies();
    this.loadAreas();
    this.loadRoles();
  }

  /**
   * Muestra un mensaje de éxito o error
   */
  private showMessage(type: 'success' | 'error', message: string) {
    if (type === 'success') {
      this.successMessage = message;
      this.errorMessage = ''; // Limpiar error si existe
      setTimeout(() => this.successMessage = '', 5000);
    } else {
      this.errorMessage = message;
      this.successMessage = ''; // Limpiar éxito si existe
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  // Cargar empresas
  loadCompanies(): void {
    this.userService.getEmpresas().subscribe({
      next: (data: any) => {
        // Asegúrate que la API devuelva empresas con las claves idEmpresa y nombre
        // Mapea los datos y cambia 'idEmpresa' por 'id'
        this.empresas = data
        .filter((empresa: any) => empresa.estado)
        .map((empresa: any) => ({
          id: empresa.idEmpresa,   // Ajuste en las claves
          nombre: empresa.nombre
        }));
        console.log('Empresas cargadas:', this.empresas); // Verifica los datos cargados
      },
      error: (err) => {
        console.error('Error al cargar las empresas', err);
        alert('No se pudieron cargar las empresas. Intente nuevamente más tarde.');
      },
    });
  }

  // Cargar áreas(this.areas = data)
  loadAreas(): void {
    this.userService.getAreas().subscribe({
      next: (data: any) => {
        // Asegúrate que la API devuelva empresas con las claves idEmpresa y nombre
        // Mapea los datos y cambia 'idEmpresa' por 'id'
        this.areas = data
        // Filtra las áreas activas antes de mapearlas
        .filter((area: any) => area.estado) // Solo áreas activas
        .map((area: any) => ({
          id: area.idArea,   // Ajuste en las claves
          nombre: area.nombre
        }));
        console.log('Areas cargadas:', this.areas); // Verifica los datos cargados
      },
      error: (err) => {
        console.error('Error al cargar las áreas', err);
        alert('No se pudieron cargar las áreas.');
      },
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
        console.log('Areas cargadas:', this.roles); // Verifica los datos cargados
      },error: (err) => {
        console.error('Error al cargar los roles', err);
        alert('No se pudieron cargar los roles.');
      },
    });
  }

  /**
   * Marca todos los controles del formulario como 'touched'
   * para mostrar los errores de validación
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
        
        if (control.invalid) {
          console.log('Control inválido:', control);
        }
      }
    });
  }

  // Enviar formulario
  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      this.errorMessage = '';
  
      const userData = this.isExternalUser ? 
        { ...this.userForm.value, ...this.EXTERNAL_USER_DEFAULTS } : 
        this.userForm.value;
  
      const request = this.isExternalUser ? 
        this.userService.registerExternalUser(userData) :
        this.userService.createUser(userData);
  
      request.subscribe({
        next: (response) => {
          this.loading = false;
          if (this.isExternalUser) {
            this.showMessage('success', 'Registro exitoso. En breve recibirás un correo para activar tu cuenta.');
            setTimeout(() => this.router.navigate(['/login']), 2000);
          } else {
            this.showMessage('success', 'Usuario creado exitosamente');
            this.userForm.reset();
            // Opcional: redirigir a la lista de usuarios
            setTimeout(() => {
              this.router.navigate(['/usuarios']);
            }, 2000);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error detallado:', error);
  
          // Verificar si el error viene en el formato esperado
          if (error.error) {
            switch (error.error.code) {
              case 'USERNAME_EXISTS':
                this.showFieldError('username', error.error.message);
                break;
              case 'EMAIL_EXISTS':
                this.showFieldError('email', error.error.message);
                break;
              case 'DOCUMENT_EXISTS':
                this.showFieldError('numeroDocumento', error.error.message);
                break;
              case 'USER_ALREADY_EXISTS':
                this.showFieldError('numeroDocumento', error.error.message);
                break;
              case 'ACTIVE_PQRS_EXISTS':
                this.showFieldError('numeroDocumento', error.error.message);
                break;
              case 'PERSON_NOT_FOUND':
              case 'ROLE_NOT_FOUND':
              case 'USER_CREATION_ERROR':
                this.errorMessage = error.error.message;
                break;
              default:
                if (error.error.message) {
                  this.errorMessage = error.error.message;
                } else {
                  this.errorMessage = error.error.mensaje || 'Error al procesar la solicitud';
                }
            }
          } else {
            this.errorMessage = 'Error de conexión. Por favor, intente nuevamente.';
          }
          
          // Para debugging
          console.log('Error response structure:', {
            errorObject: error,
            errorBody: error.error,
            errorMessage: error.error?.message,
            errorCode: error.error?.code
          });
        }
      });
    } else {
      this.markFormGroupTouched(this.userForm);
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
    }
  }
  
  private showFieldError(fieldName: string, message: string) {
    const control = this.userForm.get(fieldName);
    if (control) {
      control.setErrors({ serverError: message });
      control.markAsTouched();
    }
    this.errorMessage = message;
  
    // Opcional: hacer scroll al campo con error
    const element = document.getElementById(fieldName);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }


  private getBaseValidations(): FormValidations {
    return {
      nombres: {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ],
        messages: {
          required: 'El nombre es requerido',
          minlength: 'El nombre debe tener al menos 2 caracteres',
          pattern: 'Solo se permiten letras y espacios'
        }
      },
      apellidos: {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ],
        messages: {
          required: 'El apellido es requerido',
          minlength: 'El apellido debe tener al menos 2 caracteres',
          pattern: 'Solo se permiten letras y espacios'
        }
      },
      tipoDocumento: {
        validators: [Validators.required],
        messages: {
          required: 'El tipo de documento es requerido'
        }
      },
      numeroDocumento: {
        validators: [
          Validators.required,
          Validators.pattern('^[0-9]+$')
        ],
        messages: {
          required: 'El número de documento es requerido',
          pattern: 'Solo se permiten números'
        }
      },
      email: {
        validators: [
          Validators.required,
          Validators.email
        ],
        messages: {
          required: 'El correo electrónico es requerido',
          email: 'Ingrese un correo electrónico válido'
        }
      },
      telefono: {
        validators: [
          Validators.required,
          Validators.pattern('^[0-9]+$')
        ],
        messages: {
          required: 'El teléfono es requerido',
          pattern: 'Solo se permiten números'
        }
      },
      username: {
        validators: [Validators.required],
        messages: {
          required: 'El nombre de usuario es requerido'
        }
      },
      password: {
        validators: [
          Validators.required,
          Validators.minLength(8)
        ],
        messages: {
          required: 'La contraseña es requerida',
          minLength: 'La contraseña debe tener al menos 8 caracteres'
        }
      }
    };
  }

  // Método para obtener mensajes de error
  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);
    if (control?.touched && control?.errors) {
      // Primero verificar si hay error del servidor
      if (control.errors['serverError']) {
        return control.errors['serverError'];
      }
  
      // Luego verificar otros errores de validación
      const validations = this.getBaseValidations();
      if (controlName in validations) {
        const errorKey = Object.keys(control.errors)[0];
        return validations[controlName].messages[errorKey] || 'Campo inválido';
      }
    }
    return '';
  }

  // Método para verificar si un campo es inválido
  isFieldInvalid(controlName: string): boolean {
    const control = this.userForm.get(controlName);
    return !!control?.invalid && control?.touched;
  }

  // Método para volver
  volver() {
    if (this.isExternalUser) {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/usuarios']);
    }
  }

  // Método para alternar la visibilidad de la contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Método para alternar la visibilidad de la confirmación de contraseña
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // También puedes agregar métodos para validar la fortaleza de la contraseña
  checkPasswordStrength(password: string): void {
    this.passwordMeetsLength = password.length >= 8;
    this.passwordHasUpper = /[A-Z]/.test(password);
    this.passwordHasLower = /[a-z]/.test(password);
    this.passwordHasNumber = /[0-9]/.test(password);
    this.passwordHasSpecial = /[@$!%*?&]/.test(password);
  }
}
