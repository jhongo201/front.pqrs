# Sistema de Gestión de PQRS - Ministerio de Trabajo

## Descripción General

El Sistema de Gestión de PQRS (Peticiones, Quejas, Reclamos y Sugerencias) es una aplicación web desarrollada para el Ministerio de Trabajo que permite gestionar de manera eficiente y organizada todas las solicitudes recibidas de los ciudadanos y entidades. Esta plataforma facilita el seguimiento, asignación y resolución de las diferentes peticiones, mejorando los tiempos de respuesta y la calidad del servicio prestado.

## Objetivos del Sistema

- Centralizar la recepción y gestión de todas las PQRS dirigidas al Ministerio de Trabajo
- Facilitar el seguimiento y trazabilidad de cada solicitud desde su recepción hasta su resolución
- Asignar responsabilidades de manera clara y eficiente entre los diferentes funcionarios
- Generar estadísticas e informes que permitan evaluar la gestión y tomar decisiones
- Cumplir con los requisitos legales de atención al ciudadano y transparencia

## Arquitectura Técnica

### Frontend

- **Framework**: Angular (versión reciente)
- **Componentes UI**: Angular Material
- **Gestión de Estado**: Servicios de Angular y Observables RxJS
- **Autenticación**: JWT (JSON Web Tokens)

### Backend

- **Tecnología**: API RESTful
- **Endpoints principales**:
  - `/api/roles`: Gestión de roles y permisos
  - `/api/permisos-rol`: Asignación de permisos a roles
  - `/api/pqrs`: Gestión de solicitudes PQRS
  - `/api/usuarios`: Gestión de usuarios

## Módulos Principales

### 1. Gestión de Usuarios y Roles

Este módulo permite administrar los usuarios del sistema y sus roles, asignando permisos específicos según las responsabilidades de cada funcionario.

**Funcionalidades**:
- Creación, edición y desactivación de roles
- Asignación de permisos detallados por módulo y acción (lectura, escritura, actualización, eliminación)
- Gestión de usuarios y asignación de roles

### 2. Recepción de PQRS

Permite la recepción de solicitudes a través de diferentes canales (formulario web, correo electrónico, presencial) y su registro en el sistema.

**Funcionalidades**:
- Registro de nuevas solicitudes con información detallada
- Clasificación automática según tipo (petición, queja, reclamo, sugerencia)
- Asignación de número de radicado único
- Adjuntar documentos relacionados

### 3. Gestión y Seguimiento

Facilita el seguimiento del ciclo de vida completo de cada solicitud, desde su recepción hasta su resolución.

**Funcionalidades**:
- Asignación de responsables
- Establecimiento de plazos según tipo de solicitud
- Seguimiento de estados (recibida, en trámite, en revisión, resuelta)
- Notificaciones de vencimiento y alertas

### 4. Respuestas y Comunicaciones

Permite generar y gestionar las respuestas a las solicitudes, manteniendo un registro de todas las comunicaciones.

**Funcionalidades**:
- Generación de respuestas con plantillas predefinidas
- Aprobación de respuestas por niveles jerárquicos
- Envío de comunicaciones por diferentes canales
- Registro del historial de comunicaciones

### 5. Reportes y Estadísticas

Proporciona información estadística y reportes detallados sobre la gestión de PQRS.

**Funcionalidades**:
- Dashboard con indicadores clave de desempeño
- Reportes por tipo de solicitud, área, estado, tiempos de respuesta
- Exportación de datos en diferentes formatos
- Gráficos y visualizaciones

## Control de Acceso y Seguridad

El sistema implementa un robusto control de acceso basado en roles y permisos:

- **Roles**: Definen grupos de usuarios con responsabilidades similares
- **Permisos**: Asignados a roles para determinar qué acciones pueden realizar
- **Rutas**: Cada funcionalidad del sistema está asociada a rutas específicas
- **Matriz de Permisos**: Determina qué roles pueden acceder a qué rutas y qué acciones pueden realizar (leer, escribir, actualizar, eliminar)

## Flujo de Trabajo Típico

1. **Recepción**: Una PQRS es recibida y registrada en el sistema
2. **Clasificación**: Se clasifica según su tipo y urgencia
3. **Asignación**: Se asigna a un área o funcionario responsable
4. **Gestión**: El responsable analiza y procesa la solicitud
5. **Respuesta**: Se genera una respuesta que puede requerir aprobaciones
6. **Comunicación**: Se envía la respuesta al ciudadano
7. **Cierre**: Se marca como resuelta y se archiva

## Requisitos Técnicos

- **Navegadores soportados**: Chrome, Firefox, Edge (versiones recientes)
- **Dispositivos**: Diseño responsive para acceso desde computadores, tablets y dispositivos móviles
- **Conectividad**: Requiere conexión a internet para su funcionamiento

## Consideraciones Legales

El sistema está diseñado para cumplir con la normativa colombiana relacionada con:

- Ley 1755 de 2015 (Derecho de Petición)
- Ley 1712 de 2014 (Transparencia y Acceso a la Información)
- Ley 1581 de 2012 (Protección de Datos Personales)

## Mantenimiento y Soporte

El sistema cuenta con:

- Documentación técnica detallada
- Manual de usuario
- Soporte técnico para resolución de incidencias
- Actualizaciones periódicas para mejoras y correcciones

---

*Documento generado: Mayo 2025*
*Ministerio de Trabajo - República de Colombia*
