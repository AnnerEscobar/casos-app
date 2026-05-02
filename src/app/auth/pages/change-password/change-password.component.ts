import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
  selector: 'app-change-password',
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export default class ChangePasswordComponent {

  private fb        = inject(FormBuilder);
  private router    = inject(Router);
  private auth      = inject(AuthService);
  private snackBar  = inject(MatSnackBar);

  isLoading   = false;
  hideCurrent = true;
  hideNew     = true;
  hideConfirm = true;

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.matchValidator });

  private matchValidator(ctrl: AbstractControl): ValidationErrors | null {
    const n = ctrl.get('newPassword')?.value;
    const c = ctrl.get('confirmPassword')?.value;
    return n && c && n !== c ? { mismatch: true } : null;
  }

  goBack() { history.back(); }

  onSubmit() {
    if (this.form.invalid || this.isLoading) return;
    this.isLoading = true;
    const { currentPassword, newPassword } = this.form.value;

    this.auth.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Contraseña actualizada con éxito.', 'Cerrar', {
          duration: 3000, panelClass: ['snack-success']
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Error al cambiar la contraseña. Verifica tu contraseña actual.';
        this.snackBar.open(msg, 'Cerrar', {
          duration: 4000, panelClass: ['snack-error']
        });
      }
    });
  }
}
