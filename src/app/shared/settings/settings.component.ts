import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ThemeService } from '../theme.service';
import { AuthService } from '../../auth/auth-service/auth.service';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatSlideToggleModule, MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export default class SettingsComponent {
  theme  = inject(ThemeService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  toggleDark()   { this.theme.toggle(); }
  goBack()       { this.router.navigate(['/casos']); }
  cerrarSesion() { this.auth.logout(); }
}
