// unassigned-pqrs.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PqrsService } from '../../../core/services/pqrs.service';
import { AreaService } from '../../../core/services/area.service';
import { UserService } from '../../../core/services/user.service';


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
}

@Component({
  selector: 'app-unassigned-pqrs',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './unassigned-pqrs.component.html',
  styleUrls: ['./unassigned-pqrs.component.css']
})
export class UnassignedPqrsComponent implements OnInit {
  pqrsList: PQRS[] = [];
  isLoading = false;
  error = '';
  modalError: string = '';
  selectedPqrs: number | null = null;
  asignacionForm: FormGroup;
  
  areas: any[] = [];
  usuariosFiltrados: any[] = []; // Aquí almacenaremos los usuarios disponibles+

  // En la clase del componente
  showConfirmModal = false;
  successMessage = '';
  
  

  constructor(
    private pqrsService: PqrsService,
    private areaService: AreaService,
    private usuarioService: UserService,
    private fb: FormBuilder
  ) {
    this.asignacionForm = this.fb.group({
      area: ['', Validators.required],
      usuario: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
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

  onAreaChange() {
    const areaId = this.asignacionForm.get('area')?.value;
    if (areaId) {
      this.isLoading = true;
      this.usuarioService.getUsuariosPorArea(areaId).subscribe({
        next: (usuarios) => {
          console.log('Usuarios cargados:', usuarios); // Verifica que los usuarios lleguen correctamente
          this.usuariosFiltrados = usuarios;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.error = 'Error al cargar los usuarios del área';
          this.isLoading = false;
        }
      });

    } else {
      this.usuariosFiltrados = [];
    }
    this.asignacionForm.get('usuario')?.setValue('');
  }

  // Opcional: Agregar método para formatear el nombre del usuario
  formatearNombreUsuario(usuario: any): string {
    console.error('el nombre de el usuario es:'+ usuario.nombreCompleto);
    return usuario.nombreCompleto || usuario.username || 'Usuario sin nombre';
  }

  async onSubmitAsignacion() {
    if (this.asignacionForm.valid && this.selectedPqrs) {
      this.isLoading = true;
      this.modalError = '';
      this.successMessage = '';
      
      try {
        await this.pqrsService.asignarPQRS(
          this.selectedPqrs,
          {
            idUsuarioNuevo: this.asignacionForm.get('usuario')?.value,
            motivoCambio: this.asignacionForm.get('motivo')?.value
          }
        ).toPromise();
  
        this.successMessage = 'Asignación realizada exitosamente';
        await this.cargarPQRSSinAsignar();
        
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
    switch (prioridad.toUpperCase()) {
      case 'ALTA': return 'prioridad-alta';
      case 'MEDIA': return 'prioridad-media';
      case 'BAJA': return 'prioridad-baja';
      default: return '';
    }
  }
}