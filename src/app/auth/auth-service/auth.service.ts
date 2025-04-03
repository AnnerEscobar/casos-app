import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;


  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) {}

  // Verifica si existe un token en localStorage
  hasToken(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }

  // Observable para saber si el usuario está autenticado
  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  // Registro de usuario
  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password }).pipe(
      tap((res: any) => {
        this.saveToken(res.access_token);
        this.loggedIn.next(true);
      })
    );
  }

  // Inicio de sesión
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res: any) => {
        this.saveToken(res.access_token);
        this.loggedIn.next(true);
      })
    );
  }

  // Guardar token
  private saveToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('access_token');
    this.loggedIn.next(false);
    this.router.navigate(['/login']);
  }

  // Obtener token (si se necesita para headers)
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isTokenExpired(token: string): boolean {
    if (!token) return true;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000); // tiempo actual en segundos

    return exp < now;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return token !== null && !this.isTokenExpired(token);
  }

}
