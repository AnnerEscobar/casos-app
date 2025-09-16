import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { SharedService } from '../../../shared/shared.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth-service/auth.service';

@Component({
  selector: 'app-change-password',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export default class ChangePasswordComponent {

  passwordForm: FormGroup;

  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService, // Asegúrate de importar tu servicio SharedService
    private snackBar: MatSnackBar // Asegúrate de importar ToastrService si lo usas para notificaciones
  ) {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
    const newPass = ctrl.get('newPassword')?.value;
    const confirm = ctrl.get('confirmPassword')?.value;
    return newPass && confirm && newPass !== confirm
      ? { mismatch: true }
      : null;
  }

onSubmit(): void {
  if (this.passwordForm.valid) {
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.snackBar.open('Contraseña actualizada con éxito', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al cambiar contraseña';
        this.snackBar.open(msg, 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }
}


}
