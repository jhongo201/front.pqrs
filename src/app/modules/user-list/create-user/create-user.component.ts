import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
  encapsulation: ViewEncapsulation.None  // ← AGREGAR ESTA LÍNEA
})
export class CreateUserComponent implements OnInit {
  
  isExternalUser: boolean = false; // Para controlar el tipo de registro


  userForm!: FormGroup;  // Agregar el signo de exclamación
  areas: { id: number; nombre: string }[] = [];
  roles: { id: number; nombre: string }[] = [];
  empresas: { id: number; nombre: string }[] = [];
  departamentos: any[] = [];
  municipios: any[] = [];
  tiposDocumento: any[] = [];
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

  // Propiedades para el loading con pasos
showLoadingSteps = false;
currentStep = 0;

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
    console.log('🔥 Constructor - Iniciando componente CreateUserComponent');
    // Obtener el valor de isExternalUser de la ruta
    this.route.data.subscribe(data => {
      console.log('🔥 Route data:', data);
      this.isExternalUser = data['isExternalUser'] || false;
      console.log('🔥 Es usuario externo:', this.isExternalUser);
      this.initForm(); // Inicializar el formulario después de saber el tipo de usuario
    });
  }

  private initForm(): void {
    console.log('initForm - Iniciando formulario para isExternalUser:', this.isExternalUser);
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
    console.log('initForm - Formulario creado:', this.userForm);
  }

  ngOnInit(): void {
    console.log('🔥 ngOnInit - Iniciando componente');
    console.log('🔥 isExternalUser en ngOnInit:', this.isExternalUser);
    if (this.isExternalUser) {
      console.log('🔥 Cargando datos para usuario externo');
      this.loadTiposDocumento();
      this.loadDepartamentos();
    } else {
      console.log('🔥 Cargando datos para usuario interno');
      this.loadInitialData();
    }
    // Cargar datos comunes para todos los usuarios

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

  // Cargar tipos de documento
  loadTiposDocumento(): void {
    this.userService.getTiposDocumento().subscribe({
      next: (data: any) => {
        this.tiposDocumento = data.filter((tipo: any) => tipo.activo);
        console.log('Tipos de documento cargados:', this.tiposDocumento);
      },
      error: (err) => {
        console.error('Error al cargar los tipos de documento', err);
        alert('No se pudieron cargar los tipos de documento.');
      }
    });
  }

  // Cargar departamentos
  loadDepartamentos(): void {
    this.userService.getDepartamentos().subscribe({
      next: (data: any) => {
        this.departamentos = data.filter((dept: any) => dept.activo);
        console.log('Departamentos cargados:', this.departamentos);
      },
      error: (err) => {
        console.error('Error al cargar los departamentos', err);
        alert('No se pudieron cargar los departamentos.');
      }
    });
  }

  // Cargar municipios por departamento
  onDepartamentoChange(event: Event): void {
    console.log('onDepartamentoChange - Evento disparado:', event);
    const codigoDepartamento = (event.target as HTMLSelectElement).value;
    
    if (codigoDepartamento) {
      console.log('Cargando municipios para departamento:', codigoDepartamento);
      this.userService.getMunicipiosByDepartamento(codigoDepartamento).subscribe({
        next: (data: any) => {
          console.log('🔥🔥🔥 DEBUG onDepartamentoChange - DATOS RAW 🔥🔥🔥');
          console.log('Datos originales de la API:', data);
          console.log('Primer municipio raw:', data[0]);
          
          // Mapear municipios usando codigoDane como id
          this.municipios = data
            .filter((municipio: any) => municipio.activo)
            .map((municipio: any) => ({
              id: municipio.codigoDane, // Usar codigoDane como identificador
              nombre: municipio.nombre,
              codigoDane: municipio.codigoDane,
              codigoDepartamento: municipio.codigoDepartamento,
              activo: municipio.activo
            }));
          
          console.log('🔥🔥🔥 DEBUG onDepartamentoChange - DESPUÉS DEL MAPEO 🔥🔥🔥');
          console.log('Municipios mapeados:', this.municipios);
          console.log('Municipios con IDs y tipos:');
          this.municipios.forEach(municipio => {
            console.log(`- ${municipio.nombre}: ID=${municipio.id} (tipo: ${typeof municipio.id})`);
          });
          this.userForm.patchValue({ idMunicipio: '' }); // Limpiar selección anterior
        },
        error: (err) => {
          console.error('Error al cargar municipios:', err);
          this.municipios = [];
        }
      });
    } else {
      this.municipios = [];
      this.userForm.patchValue({ idMunicipio: '' });
    }
  }

  // Debug: Capturar cambios en el select de municipios
  onMunicipioChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('🔥🔥🔥 DEBUG onMunicipioChange 🔥🔥🔥');
    console.log('Valor seleccionado del select:', selectedValue);
    console.log('Tipo del valor:', typeof selectedValue);
    console.log('Valor del form control después del cambio:', this.userForm.get('idMunicipio')?.value);
    console.log('Municipios disponibles para verificar:', this.municipios);
    
    // Buscar el municipio seleccionado en la lista (por codigoDane)
    const municipioSeleccionado = this.municipios.find(m => m.id === selectedValue);
    console.log('Municipio encontrado:', municipioSeleccionado);
    
    if (municipioSeleccionado) {
      console.log('✅ Municipio válido seleccionado:', municipioSeleccionado.nombre);
      console.log('✅ Código DANE que se enviará:', municipioSeleccionado.id);
    } else {
      console.log('❌ No se encontró municipio con código:', selectedValue);
    }
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
    console.log('🔥🔥🔥 INICIO onSubmit - FORMULARIO ENVIADO 🔥🔥🔥');
    console.log('🔥 Formulario válido:', this.userForm.valid);
    console.log('🔥 isExternalUser:', this.isExternalUser);
    
    if (this.userForm.valid) {
      this.loading = true;
      this.showLoadingSteps = true;
      this.currentStep = 1;
      this.errorMessage = '';

      // DEBUG: Verificar valores del formulario antes de enviar
      console.log('=== DEBUG onSubmit ===');
      console.log('Valores del formulario:', this.userForm.value);
      
      const idMunicipioValue = this.userForm.get('idMunicipio')?.value;
      console.log('idMunicipio específico:', idMunicipioValue);
      console.log('Tipo de idMunicipio:', typeof idMunicipioValue);
      
      // Buscar el municipio seleccionado para mostrar información completa
      const municipioSeleccionado = this.municipios.find(m => m.id === idMunicipioValue);
      if (municipioSeleccionado) {
        console.log('✅ Municipio que se enviará:', municipioSeleccionado);
        console.log('✅ Código DANE:', municipioSeleccionado.codigoDane);
        console.log('✅ Nombre:', municipioSeleccionado.nombre);
      } else {
        console.log('❌ No se encontró municipio con ID:', idMunicipioValue);
        console.log('❌ Municipios disponibles:', this.municipios.map(m => ({ id: m.id, nombre: m.nombre })));
      }
      
      console.log('Departamento seleccionado:', this.userForm.get('departamento')?.value);

      const userData = this.isExternalUser ? 
        { ...this.userForm.value, ...this.EXTERNAL_USER_DEFAULTS } : 
        this.userForm.value;
      
      console.log('userData final a enviar:', userData);

      const request = this.isExternalUser ? 
        this.userService.registerExternalUser(userData) :
        this.userService.createUser(userData);

      // Simular pasos del proceso
      setTimeout(() => this.currentStep = 2, 500);
      setTimeout(() => this.currentStep = 3, 1000);
  
      request.subscribe({
        next: (response) => {
          setTimeout(() => {
            this.currentStep = 4;
            setTimeout(() => {
              this.loading = false;
              this.showLoadingSteps = false;
              this.currentStep = 0;
              
              if (this.isExternalUser) {
                this.showMessage('success', 'Registro exitoso. En breve recibirás un correo para activar tu cuenta.');
                setTimeout(() => this.router.navigate(['/login']), 3000);
              } else {
                this.showMessage('success', 'Usuario creado exitosamente');
                this.userForm.reset();
                setTimeout(() => {
                  this.router.navigate(['/usuarios']);
                }, 2000);
              }
            }, 800);
          }, 500);
        },
        error: (error) => {
          this.loading = false;
          this.showLoadingSteps = false;
          this.currentStep = 0;
          console.error('Error detallado:', error);
  
          // [Mantener el mismo manejo de errores que ya tienes]
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
        }
      });
    } else {
    console.log('🔥🔥🔥 FORMULARIO NO VÁLIDO 🔥🔥🔥');
    console.log('🔥 Errores del formulario:', this.userForm.errors);
    console.log('🔥 Controles inválidos:');
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control && control.invalid) {
        console.log(`🔥   - ${key}:`, control.errors);
      }
    });
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
      primerNombre: {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ],
        messages: {
          required: 'El primer nombre es requerido',
          minlength: 'El primer nombre debe tener al menos 2 caracteres',
          maxlength: 'El primer nombre no puede superar 50 caracteres',
          pattern: 'Solo se permiten letras y espacios'
        }
      },
      otrosNombres: {
        validators: [
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
        ],
        messages: {
          maxlength: 'Los otros nombres no pueden superar 50 caracteres',
          pattern: 'Solo se permiten letras y espacios'
        }
      },
      primerApellido: {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ],
        messages: {
          required: 'El primer apellido es requerido',
          minlength: 'El primer apellido debe tener al menos 2 caracteres',
          maxlength: 'El primer apellido no puede superar 50 caracteres',
          pattern: 'Solo se permiten letras y espacios'
        }
      },
      segundoApellido: {
        validators: [
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
        ],
        messages: {
          maxlength: 'El segundo apellido no puede superar 50 caracteres',
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
          Validators.minLength(6),
          Validators.maxLength(15),
          Validators.pattern('^[0-9]+$')
        ],
        messages: {
          required: 'El número de documento es requerido',
          minlength: 'El documento debe tener al menos 6 caracteres',
          maxlength: 'El documento no puede superar 15 caracteres',
          pattern: 'Solo se permiten números'
        }
      },
      email: {
        validators: [
          Validators.required,
          Validators.email,
          Validators.maxLength(100)
        ],
        messages: {
          required: 'El correo electrónico es requerido',
          email: 'Ingrese un correo electrónico válido',
          maxlength: 'El correo no puede superar 100 caracteres'
        }
      },
      telefono: {
        validators: [
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(10),
          Validators.pattern('^[0-9]+$')
        ],
        messages: {
          required: 'El teléfono es requerido',
          minlength: 'El teléfono debe tener al menos 7 dígitos',
          maxlength: 'El teléfono no puede superar 10 dígitos',
          pattern: 'Solo se permiten números'
        }
      },
      username: {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern('^[a-zA-Z0-9._-]+$')
        ],
        messages: {
          required: 'El nombre de usuario es requerido',
          minlength: 'El usuario debe tener al menos 3 caracteres',
          maxlength: 'El usuario no puede superar 20 caracteres',
          pattern: 'Solo se permiten letras, números, puntos, guiones y guiones bajos'
        }
      },
      password: {
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(50),
          this.passwordStrengthValidator
        ],
        messages: {
          required: 'La contraseña es requerida',
          minlength: 'La contraseña debe tener al menos 8 caracteres',
          maxlength: 'La contraseña no puede superar 50 caracteres',
          passwordStrength: 'La contraseña debe cumplir todos los requisitos de seguridad'
        }
      },
      departamento: {
        validators: [Validators.required],
        messages: {
          required: 'El departamento es requerido'
        }
      },
      idMunicipio: {
        validators: [Validators.required],
        messages: {
          required: 'El municipio es requerido'
        }
      }
    };
  }
  
  // Validador personalizado para la fortaleza de la contraseña
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;
  
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
  
    const valid = hasUpper && hasLower && hasNumber && hasSpecial;
    return valid ? null : { passwordStrength: true };
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
