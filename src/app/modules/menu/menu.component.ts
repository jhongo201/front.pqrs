import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service'; // Ajusta la ruta según tu estructura

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'], // Ajusta según tu estructura
})
export class MenuComponent {

  isUsersMenuOpen = false;
  isPqrsMenuOpen = false;
  activeMenuItem: string | null = null;
  activeSubmenuItem: string | null = null;

  constructor(public authService: AuthService) {}

  toggleUsersMenu() {
    this.isUsersMenuOpen = !this.isUsersMenuOpen;
    if (this.isUsersMenuOpen) {
      this.isPqrsMenuOpen = false; // Cerrar el otro menú
    }
  } 

  // Nuevo método para toggle del menú PQRS
  togglePqrsMenu() {
    this.isPqrsMenuOpen = !this.isPqrsMenuOpen;
    if (this.isPqrsMenuOpen) {
      this.isUsersMenuOpen = false; // Cerrar el otro menú
    }
  }

  setActiveMenuItem(menuItem: string, submenuItem?: string) {
    this.activeMenuItem = menuItem;
    this.activeSubmenuItem = submenuItem || null;
  }

  isSubmenuItemActive(submenuItem: string): boolean {
    return this.activeSubmenuItem === submenuItem;
  }

} 
 