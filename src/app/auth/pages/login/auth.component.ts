/* import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../auth-service/auth.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { CommonModule } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-auth',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export default class AuthComponent {


  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/casos';
  }

  onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: () => this.router.navigate(['/casos']),
        error: () => alert('Credenciales incorrectas')
      });
    }
  }
}
 */

import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../auth-service/auth.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-auth',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export default class AuthComponent {
  loginForm: FormGroup;
  hide = true;         // ver/ocultar contraseña
  loading = false;     // estado de carga
  submitted = false;   // para mostrar errores al enviar
  sessionExpired = false;
  loginError = '';
  private returnUrl = '/casos';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/casos';
    this.sessionExpired = this.route.snapshot.queryParamMap.get('sessionExpired') === '1';
  }

  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  onLogin() {
    this.submitted = true;
    if (this.loginForm.invalid || this.loading) return;

    this.loading = true;
    this.loginError = '';
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 429) {
          this.loginError = 'Has alcanzado el límite de intentos de inicio de sesión. El acceso está bloqueado temporalmente. Espera unos minutos antes de volver a intentarlo; el límite se restablece dentro de los 15 minutos desde el primer intento.';
        } else if (error.status === 401) {
          this.loginError = error.error?.message === 'Usuario inactivo, contacte al administrador'
            ? 'Tu cuenta está inactiva. Comunícate con el administrador para recuperar el acceso.'
            : 'El correo o la contraseña son incorrectos. Revisa tus datos antes de volver a intentarlo.';
        } else if (error.status === 0) {
          this.loginError = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
        } else if (error.status === 403) {
          this.loginError = 'No tienes acceso al sistema. Comunícate con el administrador para revisar el estado de tu cuenta.';
        } else {
          this.loginError = 'No se pudo iniciar sesión en este momento. Intenta nuevamente más tarde.';
        }
      }
    });
  }
}

