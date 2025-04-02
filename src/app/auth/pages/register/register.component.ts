import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCardModule} from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../auth-service/auth.service';
import { Router } from '@angular/router';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-register',
  imports: [MatButtonModule, MatFormFieldModule, CommonModule, MatCardModule, ReactiveFormsModule, MatInputModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export default class RegisterComponent {

  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    const { email, password } = this.registerForm.value;
    this.authService.register(email, password).subscribe({
      next: () => this.router.navigate(['/casos']),
      error: () => alert('No se pudo registrar')
    });
  }
}
