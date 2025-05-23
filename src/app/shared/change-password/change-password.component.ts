import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule
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
      // TODO: llamar a tu servicio de usuario para cambiar contraseña
      console.log({ currentPassword, newPassword });
      this.router.navigate(['/login']);
    }
  }

}
