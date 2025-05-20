import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PqrsService } from '../../../core/services/pqrs.service';
import { UserService } from '../../../core/services/user.service';
import { AreaService } from '../../../core/services/area.service';

interface AsignacionPQRS {
  usuario: {
    idUsuario: number;
    nombreCompleto: string;
  };
  pqrsAsignados: any[];
}

interface PQRS {
  idPqrs: number;
  nombreSolicitante: string;
  emailSolicitante: string;
  telefonoSolicitante: string;
  tipoDocumentoSolicitante: string;
  numeroDocumentoSolicitante: string;
  numeroRadicado?: string; // Para cuando viene como numeroRadicado
  tema: {
    idTema: number;
    nombre: string;
    descripcion: string;
    estado: boolean;
    area: {
      idArea: number;
      nombre: string;
    }
  };
  titulo: string;
  descripcion: string;
  prioridad: string;
  estadoPqrs: string;
  fechaCreacion: string;
  fechaUltimaActualizacion: string;
  seguimientos: Array<{
    idSeguimiento: number;
    usuario: {
      idUsuario: number;
      username: string;
      nombreCompleto: string;
      email: string;
    };
    comentario: string;
    archivoAdjunto?: string;
    esRespuestaFinal: boolean;
    fechaCreacion: string;
    tipoSeguimiento: string;
  }>;
  usuarioAsignado?: {
    idUsuario: number;
    nombreCompleto: string;
    username: string;
  };

}

@Component({
  selector: 'app-assigned-pqrs',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './assigned-pqrs.component.html',
  styleUrls: ['./assigned-pqrs.component.css']
})
export class AssignedPqrsComponent implements OnInit {
  usuarios: any[] = [];
  asignaciones: AsignacionPQRS[] = [];
  isLoading = false;
  error = '';
  modalError: string = '';
  selectedPqrs: number | null = null;
  reasignacionForm: FormGroup;



  pqrsList: PQRS[] = [];
  asignacionForm: FormGroup;
  
  areas: any[] = [];
  usuariosFiltrados: any[] = []; // Aquí almacenaremos los usuarios disponibles+

  // En la clase del componente
  showConfirmModal = false;
  successMessage = '';


  constructor(
    private pqrsService: PqrsService,
    private areaService: AreaService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.reasignacionForm = this.fb.group({
      usuarioNuevo: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.asignacionForm = this.fb.group({
      area: ['', Validators.required],
      usuario: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });

  }



  ngOnInit() {
    this.cargarUsuarios();
    this.cargarPQRSSinAsignar();
    this.cargarAreas();
  }

  cargarAreas() {
    this.areaService.listarAreas().subscribe({
      next: (data) => {
        this.areas = data;
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
        this.error = 'Error al cargar las áreas';
      }
    });
  }

  cargarPQRSSinAsignar() {
    this.isLoading = true;
    this.pqrsService.listarPQRSSinAsignar().subscribe({
      next: (data) => {
        this.pqrsList = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las PQRS sin asignar';
        this.isLoading = false;
        console.error('Error:', error);
      }
    });
  }

  cargarUsuarios() {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargarAsignaciones();
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.error = 'Error al cargar usuarios';
        this.isLoading = false;
      }
    });
  }

  onAreaChange() {
    const areaId = this.asignacionForm.get('area')?.value;
    console.log('Área seleccionada:', areaId);
    
    if (!areaId) {
      this.usuariosFiltrados = [];
      this.asignacionForm.get('usuario')?.setValue(null);
      return;
    }
  
    this.isLoading = true;
    this.userService.getUsuariosPorArea(areaId).subscribe({
      next: (usuarios) => {
        console.log('Usuarios obtenidos para el área:', usuarios);
        this.usuariosFiltrados = usuarios;
        // Si hay un usuario seleccionado previamente, verificar si aún está disponible
        const usuarioActual = this.asignacionForm.get('usuario')?.value;
        if (usuarioActual && !usuarios.some(u => u.idUsuario === usuarioActual)) {
          this.asignacionForm.get('usuario')?.setValue(null);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.modalError = 'Error al cargar los usuarios del área';
        this.isLoading = false;
        this.usuariosFiltrados = [];
      }
    });
  }

  // Opcional: Agregar método para formatear el nombre del usuario
  formatearNombreUsuario(usuario: any): string {
    console.error('el nombre de el usuario es:'+ usuario.nombreCompleto);
    return usuario.nombreCompleto || usuario.username || 'Usuario sin nombre';
  }

  async onSubmitAsignacion() {
    if (this.asignacionForm.valid && this.selectedPqrs) {
      const nuevoUsuarioId = this.asignacionForm.get('usuario')?.value;
      
      // Buscar el PQRS actual
      let pqrsActual: any = null;
      for (const asignacion of this.asignaciones) {
        const found = asignacion.pqrsAsignados.find(p => p.idPqrs === this.selectedPqrs);
        if (found) {
          pqrsActual = found;
          break;
        }
      }
      
      // Convertir IDs a número para comparar
      if (pqrsActual?.usuarioAsignado?.idUsuario === Number(nuevoUsuarioId)) {
        this.modalError = 'El usuario seleccionado ya está asignado a este PQRS';
        return;
      }
  
      this.isLoading = true;
      this.modalError = '';
      this.successMessage = '';
      
      try {
        await this.pqrsService.asignarPQRS(
          this.selectedPqrs,
          {
            idUsuarioNuevo: nuevoUsuarioId,
            motivoCambio: this.asignacionForm.get('motivo')?.value
          }
        ).toPromise();
  
        this.successMessage = 'Asignación realizada exitosamente';
        await this.cargarAsignaciones();
        
        this.asignacionForm.disable();
        
        setTimeout(() => {
          this.cerrarModal();
          this.asignacionForm.enable();
        }, 2000);
  
      } catch (error) {
        console.error('Error al asignar PQRS:', error);
        this.modalError = 'Error al realizar la asignación';
      } finally {
        this.isLoading = false;
      }
    }
  }

  onUsuarioChange() {
    const nuevoUsuarioId = this.asignacionForm.get('usuario')?.value;
    if (!nuevoUsuarioId) return;
  
    // Buscar el PQRS actual en las asignaciones
    let pqrsActual: any = null;
    for (const asignacion of this.asignaciones) {
      const found = asignacion.pqrsAsignados.find(p => p.idPqrs === this.selectedPqrs);
      if (found) {
        pqrsActual = found;
        break;
      }
    }
  
    // Convertir los IDs a número para comparar
    const nuevoUsuarioIdNum = Number(nuevoUsuarioId);
    const usuarioActualIdNum = Number(pqrsActual?.usuarioAsignado?.idUsuario);
  
    console.log('Comparando usuarios:', {
      nuevo: nuevoUsuarioIdNum,
      actual: usuarioActualIdNum
    });
  
    if (pqrsActual?.usuarioAsignado && nuevoUsuarioIdNum === usuarioActualIdNum) {
      this.modalError = 'El usuario seleccionado ya está asignado a este PQRS';
      this.asignacionForm.get('usuario')?.setErrors({ 'usuarioRepetido': true });
    } else {
      this.modalError = '';
      const usuarioErrors = this.asignacionForm.get('usuario')?.errors;
      if (usuarioErrors) {
        delete usuarioErrors['usuarioRepetido'];
        this.asignacionForm.get('usuario')?.setErrors(
          Object.keys(usuarioErrors).length === 0 ? null : usuarioErrors
        );
      }
    }
  }

  cerrarModal() {
    this.selectedPqrs = null;
    this.asignacionForm.reset();
    this.usuariosFiltrados = [];
    this.modalError = '';
    this.successMessage = '';
  }

  asignarPQRS(idPqrs: number, idUsuario: number) {
    this.isLoading = true;
    this.pqrsService.asignarPQRS(idPqrs, { idUsuarioNuevo: idUsuario, motivoCambio: 'Asignación inicial' })
      .subscribe({
        next: () => {
          this.cargarPQRSSinAsignar();
          this.selectedPqrs = null;
        },
        error: (error) => {
          this.error = 'Error al asignar la PQRS';
          this.isLoading = false;
          console.error('Error:', error);
        }
      });
  }

  async cargarAsignaciones() {
    try {
      this.isLoading = true;
      const pqrsList = await this.pqrsService.listarPQRS().toPromise();
      
      if (pqrsList) {
        this.asignaciones = this.agruparPqrsPorUsuario(pqrsList);
      } else {
        this.asignaciones = [];
      }
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      this.error = 'Error al cargar asignaciones';
      this.asignaciones = [];
    } finally {
      this.isLoading = false;
    }
  }

  reasignarPQRS(pqrsId: number) {
    if (this.reasignacionForm.valid) {
      this.isLoading = true;
      this.pqrsService.asignarPQRS(
        pqrsId,
        {
          idUsuarioNuevo: this.reasignacionForm.get('usuarioNuevo')?.value,
          motivoCambio: this.reasignacionForm.get('motivo')?.value
        }
      ).subscribe({
        next: () => {
          this.cargarAsignaciones();
          this.selectedPqrs = null;
          this.reasignacionForm.reset();
        },
        error: (error) => {
          console.error('Error al reasignar:', error);
          this.error = 'Error al reasignar PQRS';
          this.isLoading = false;
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'EN_PROCESO': return 'estado-proceso';
      case 'RESUELTO': return 'estado-resuelto';
      case 'CERRADO': return 'estado-cerrado';
      default: return '';
    }
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad?.toUpperCase()) {
      case 'ALTA': return 'prioridad-alta';
      case 'MEDIA': return 'prioridad-media';
      case 'BAJA': return 'prioridad-baja';
      default: return '';
    }
  }

  refreshView() {
    this.cargarUsuarios();
    this.cargarAsignaciones();
  }

  // En assigned-pqrs.component.ts
  openAsignacionModal(pqrs: PQRS) {
    console.log('1. PQRS recibido:', pqrs);
    
    this.selectedPqrs = pqrs.idPqrs;
    this.error = '';
    this.modalError = '';
    this.successMessage = '';
  
    // Resetear el formulario
    this.asignacionForm.reset();
    this.usuariosFiltrados = [];
  
    // Verificar si tenemos usuario asignado
    if (pqrs.usuarioAsignado) {
      console.log('2. Usuario asignado encontrado:', pqrs.usuarioAsignado);
      
      // Primero obtener la información completa del usuario
      this.userService.getUserDetailById(pqrs.usuarioAsignado.idUsuario).subscribe({
        next: (userDetail) => {
          console.log('3. Detalle del usuario obtenido:', userDetail);
          
          // Esperar a que el área se establezca antes de cargar los usuarios
          setTimeout(() => {
            this.asignacionForm.patchValue({
              area: userDetail.idArea
            });
            
            console.log('4. Área establecida:', userDetail.idArea);
            console.log('4.1 Valor actual del formulario:', this.asignacionForm.value);
  
            // Ahora cargar los usuarios del área
            this.userService.getUsuariosPorArea(userDetail.idArea).subscribe({
              next: (usuarios) => {
                console.log('5. Usuarios obtenidos:', usuarios);
                this.usuariosFiltrados = usuarios;
  
                // Finalmente establecer el usuario
                setTimeout(() => {
                  this.asignacionForm.patchValue({
                    usuario: pqrs.usuarioAsignado?.idUsuario
                  });
                  console.log('6. Usuario establecido:', pqrs.usuarioAsignado?.idUsuario);
                  console.log('6.1 Estado final del formulario:', this.asignacionForm.value);
                });
              },
              error: (error) => {
                console.error('Error al cargar usuarios:', error);
                this.modalError = 'Error al cargar usuarios del área';
              }
            });
          });
        },
        error: (error) => {
          console.error('Error al obtener detalle del usuario:', error);
          this.modalError = 'Error al obtener información del usuario';
        }
      });
    } else {
      console.log('2. No hay usuario asignado, usando área del tema');
      if (pqrs.tema?.area) {
        this.asignacionForm.patchValue({
          area: pqrs.tema.area.idArea
        });
  
        this.userService.getUsuariosPorArea(pqrs.tema.area.idArea).subscribe({
          next: (usuarios) => {
            this.usuariosFiltrados = usuarios;
            console.log('3. Usuarios del área cargados:', usuarios);
          },
          error: (error) => {
            console.error('Error al cargar usuarios:', error);
            this.modalError = 'Error al cargar usuarios del área';
          }
        });
      }
    }
  }

  agruparPqrsPorUsuario(pqrsList: any[]) {
    const agrupados = new Map();
    
    // Crear un grupo para PQRS sin asignar
    agrupados.set('sin_asignar', {
      usuario: { nombreCompleto: 'Sin Asignar' },
      pqrsAsignados: []
    });
  
    pqrsList.forEach(pqrs => {
      if (pqrs.usuarioAsignado) {
        const userId = pqrs.usuarioAsignado.idUsuario;
        if (!agrupados.has(userId)) {
          agrupados.set(userId, {
            usuario: pqrs.usuarioAsignado,
            pqrsAsignados: []
          });
        }
        agrupados.get(userId).pqrsAsignados.push(pqrs);
      } else {
        agrupados.get('sin_asignar').pqrsAsignados.push(pqrs);
      }
    });
  
    return Array.from(agrupados.values());
  }

}