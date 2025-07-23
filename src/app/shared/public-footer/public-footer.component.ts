// src/app/shared/components/public-footer/public-footer.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="public-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Ministerio del Trabajo</h4>
          <p>Módulo de Solicitudes de Soporte Técnico para Sistemas de Información de la Dirección de Riesgos Laborales</p>
        </div>
        <div class="footer-section">
          <h4>Enlaces Útiles</h4>
          <a href="https://www.mintrabajo.gov.co" target="_blank">Sitio Web Oficial</a>
          <!--<a href="#">Términos y Condiciones</a>
          <a href="#">Política de Privacidad</a>-->
        </div>
        <div class="footer-section">
          <h4>Contacto</h4>
          <p><i class="fas fa-phone"></i> Línea gratuita nacional: 018000 513100</p>
          <p><i class="fas fa-envelope"></i> solucionesdocumental</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 Ministerio del Trabajo. Todos los derechos reservados.</p>
      </div>
    </footer>
  `,
  styles: [`
    .public-footer {
      background-color: #1e293b;
      color: #e2e8f0;
      padding: 3rem 2rem 1rem;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer-section h4 {
      color: white;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .footer-section p {
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .footer-section a {
      color: #94a3b8;
      text-decoration: none;
      display: block;
      margin-bottom: 0.5rem;
      transition: color 0.2s;
    }

    .footer-section a:hover {
      color: #3b82f6;
    }

    .footer-section i {
      margin-right: 0.5rem;
      color: #3b82f6;
    }

    .footer-bottom {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid #334155;
      color: #64748b;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .footer-section {
        margin-bottom: 2rem;
      }
    }
  `]
})
export class PublicFooterComponent {}