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
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {}

  hasToken(): boolean {
    return this.loggedIn.value;
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(() => this.loggedIn.next(true))
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  checkSession(): Observable<any> {
    return this.http.get(`${this.apiUrl}/session`).pipe(
      tap(() => this.loggedIn.next(true))
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.http.patch(`${this.apiUrl}/change-password`, data);
  }

  recoverPassword(email: string) {
    return this.http.post(`${this.apiUrl}/recover-password`, { email });
  }

  private finishLogout(): void {
    this.loggedIn.next(false);
    this.router.navigate(['/login']);
  }

}
