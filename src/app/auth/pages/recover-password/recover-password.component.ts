import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../auth-service/auth.service';

@Component({
  selector: 'app-recover-password',
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './recover-password.component.html',
  styleUrl: './recover-password.component.css'
})
export default class RecoverPasswordComponent {

  private fb       = inject(FormBuilder);
  private router   = inject(Router);
  private auth     = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  isLoading = false;
  enviado   = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  goBack() { this.router.navigate(['/login']); }

  onSubmit() {
    if (this.form.invalid || this.isLoading) return;
    this.isLoading = true;
    const email = this.form.value.email!;

    this.auth.recoverPassword(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.enviado   = true;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open(
          'No se encontró una cuenta con ese correo.',
          'Cerrar',
          { duration: 4000, panelClass: ['snack-error'] }
        );
      }
    });
  }
}
