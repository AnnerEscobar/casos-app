import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environment.prod';
import { SessionUser } from '../models/session-user.model';
import { UserRole } from '../enums/user-role.enum';

const SESSION_DURATION_MS = 15 * 60 * 1000;
const SESSION_EXPIRES_AT_KEY = 'session_expires_at';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private actividadPendiente = false;
  private renovando = false;
  private cerrando = false;
  private idleTimeoutMs = SESSION_DURATION_MS;
  private timer?: ReturnType<typeof setInterval>;
  private readonly actividadUsuario = () => {
    if (!this.loggedIn.value) return;
    this.actividadPendiente = true;
    if ((this.getSessionExpiresAt() || 0) - Date.now() <= 10000) this.revisarActividad();
  };
  private readonly sincronizar = (e: StorageEvent) => {
    if (e.key !== SESSION_EXPIRES_AT_KEY) return;
    this.zone.run(() => {
      if (!e.newValue) this.finishLogout(true);
      else this.sessionExpiresAt.next(Number(e.newValue));
    });
  };

  private apiUrl = `${environment.apiUrl}/auth`;
  private loggedIn = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<SessionUser | null>(null);
  private sessionExpiresAt = new BehaviorSubject<number | null>(this.readStoredSessionExpiresAt());


  constructor(private http: HttpClient, private router: Router, private zone: NgZone) {
    this.zone.runOutsideAngular(() => {
      for (const evento of ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'])
        window.addEventListener(evento, this.actividadUsuario, { passive: true, capture: true });
      window.addEventListener('storage', this.sincronizar);
      this.timer = setInterval(() => this.revisarActividad(), 10000);
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    for (const evento of ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'])
      window.removeEventListener(evento, this.actividadUsuario, true);
    window.removeEventListener('storage', this.sincronizar);
  }

  private recibirPlazo(response: any): void {
    this.idleTimeoutMs = Number(response?.idleTimeoutMs) || SESSION_DURATION_MS;
    this.setSessionExpiresAt(this.parseExpiresAt(response?.expiresAt ?? response?.user?.expiresAt) ?? Date.now() + this.idleTimeoutMs);
  }

  // Solo las interacciones disparan renovación; el polling y las respuestas HTTP no.
  private revisarActividad(): void {
    if (!this.loggedIn.value || this.cerrando || this.renovando) return;
    const plazo = this.getSessionExpiresAt();
    if (plazo && Date.now() >= plazo) {
      // Otra pestaña puede haber renovado la sesión: consultar no renueva el plazo.
      this.renovando = true;
      this.zone.run(() => this.checkSession().subscribe({
        next: () => { this.renovando = false; },
        error: () => { this.renovando = false; this.finishLogout(true); },
      }));
      return;
    }
    if (!this.actividadPendiente) return;
    this.actividadPendiente = false;
    this.renovando = true;
    this.zone.run(() => this.http.post(this.apiUrl + '/actividad', {}).subscribe({
      next: response => { if (this.loggedIn.value && !this.cerrando) this.recibirPlazo(response); this.renovando = false; },
      error: error => {
        this.renovando = false;
        if (error.status === 401) this.finishLogout(true);
        else this.actividadPendiente = true;
      },
    }));
  }

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
        this.cerrando = false;
        this.actividadPendiente = false;
        this.recibirPlazo(response);
      })
    );
  }

  logout(): void {
    if (this.cerrando) return;
    this.cerrando = true;
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  expireSession(): void {
    this.actividadPendiente = false;
    this.loggedIn.next(false);
    this.currentUser.next(null);
    this.setSessionExpiresAt(null);
  }

  checkSession(): Observable<any> {
    return this.http.get(`${this.apiUrl}/session`).pipe(
      tap((response: any) => {
        this.loggedIn.next(true);
        this.currentUser.next(response.user);
        this.cerrando = false;
        this.recibirPlazo(response);
      })
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.http.patch(`${this.apiUrl}/change-password`, data);
  }



  private finishLogout(expirada = false): void {
    this.loggedIn.next(false);
    this.currentUser.next(null);
    this.setSessionExpiresAt(null);
    if (expirada && this.router.url && this.router.url !== '/login') {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url, sessionExpired: '1' } });
    } else this.router.navigate(['/login']);
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
      localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(value));
    } else {
      localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
    }
    this.sessionExpiresAt.next(value);
  }

  private readStoredSessionExpiresAt(): number | null {
    const stored = Number(localStorage.getItem(SESSION_EXPIRES_AT_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  }

  getCurrentUser(): SessionUser | null {
    return this.currentUser.value;
  }

  currentUser$(): Observable<SessionUser | null> {
    return this.currentUser.asObservable();
  }

 hasRole(role: UserRole): boolean {
  return this.currentUser.value?.role === role;
}

}
