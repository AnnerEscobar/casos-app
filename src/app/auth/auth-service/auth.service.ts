import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environment.prod';

const SESSION_DURATION_MS = 60 * 60 * 1000;
const SESSION_EXPIRES_AT_KEY = 'session_expires_at';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;
  private loggedIn = new BehaviorSubject<boolean>(false);
  private sessionExpiresAt = new BehaviorSubject<number | null>(this.readStoredSessionExpiresAt());

  constructor(private http: HttpClient, private router: Router) {}

  hasToken(): boolean {
    return this.loggedIn.value;
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  getSessionExpiresAt(): number | null {
    return this.sessionExpiresAt.value;
  }

  sessionExpiresAt$(): Observable<number | null> {
    return this.sessionExpiresAt.asObservable();
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        this.loggedIn.next(true);
        this.setSessionExpiresAt(this.parseExpiresAt(response?.expiresAt) ?? Date.now() + SESSION_DURATION_MS);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  expireSession(): void {
    this.loggedIn.next(false);
    this.setSessionExpiresAt(null);
  }

  checkSession(): Observable<any> {
    return this.http.get(`${this.apiUrl}/session`).pipe(
      tap((response: any) => {
        this.loggedIn.next(true);
        const expFromJwt = response?.user?.exp ? Number(response.user.exp) * 1000 : null;
        const stored = this.getSessionExpiresAt();
        this.setSessionExpiresAt(expFromJwt ?? (stored && stored > Date.now() ? stored : Date.now() + SESSION_DURATION_MS));
      })
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
    this.setSessionExpiresAt(null);
    this.router.navigate(['/login']);
  }

  private parseExpiresAt(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private setSessionExpiresAt(value: number | null): void {
    if (value) {
      sessionStorage.setItem(SESSION_EXPIRES_AT_KEY, String(value));
    } else {
      sessionStorage.removeItem(SESSION_EXPIRES_AT_KEY);
    }
    this.sessionExpiresAt.next(value);
  }

  private readStoredSessionExpiresAt(): number | null {
    const stored = Number(sessionStorage.getItem(SESSION_EXPIRES_AT_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  }

}
