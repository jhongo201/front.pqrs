import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PublicHeaderComponent } from "../../shared/public-header/public-header.component";
import { PublicFooterComponent } from "../../shared/public-footer/public-footer.component";

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, MatButtonModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {
  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/registro-externo']);
  }

  goToActivateToken() {
    this.router.navigate(['/activate-user']);
  }

  goToCretaPqrs() {
    this.router.navigate(['/pqrs/nuevo-pqrs']);
  }

}