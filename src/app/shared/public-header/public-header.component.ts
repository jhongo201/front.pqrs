// src/app/shared/components/public-header/public-header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="public-header">
      <div class="header-content">
        <a href="/" class="logo">
          <i class="fas fa-building"></i>
          <span>Ministerio del Trabajo</span>
        </a>
        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Inicio</a>
          <a routerLink="/login" routerLinkActive="active">Iniciar Sesión</a>
          <a routerLink="/registro-externo" routerLinkActive="active">Registrarse</a>
          <a routerLink="/activate-user" routerLinkActive="active">Activar Cuenta</a>
          <a routerLink="/pqrs/nuevo-pqrs" routerLinkActive="active">Crear PQRS</a>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .public-header {
      background-color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1rem 2rem;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #1e293b;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .logo i {
      color: #3b82f6;
      font-size: 1.5rem;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
    }

    .nav-links a {
      color: #64748b;
      text-decoration: none;
      font-size: 0.95rem;
      padding: 0.5rem 0;
      transition: color 0.2s;
      position: relative;
    }

    .nav-links a:hover {
      color: #3b82f6;
    }

    .nav-links a.active {
      color: #3b82f6;
    }

    .nav-links a.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #3b82f6;
      border-radius: 2px;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-links {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `]
})
export class PublicHeaderComponent {}