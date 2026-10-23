import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('Sesión por actividad del usuario', () => {
  let auth: AuthService, http: HttpTestingController, router: any;
  const plazo = 15 * 60 * 1000;
  beforeEach(() => {
    localStorage.removeItem('session_expires_at');
    router = { navigate: jasmine.createSpy().and.resolveTo(true) };
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: router }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { auth.ngOnDestroy(); http.verify(); localStorage.removeItem('session_expires_at'); });
  function iniciar() {
    auth = TestBed.inject(AuthService);
    auth.login('usuario', 'contraseña').subscribe();
    http.expectOne(r => r.url.endsWith('/auth/login')).flush({ expiresAt: Date.now() + plazo, idleTimeoutMs: plazo });
  }
  it('las consultas de sesión no generan renovaciones de actividad', fakeAsync(() => {
    iniciar();
    auth.checkSession().subscribe();
    http.expectOne(r => r.url.endsWith('/auth/session')).flush({ user: {}, expiresAt: Date.now() + plazo, idleTimeoutMs: plazo });
    tick(30000);
    http.expectNone(r => r.url.endsWith('/actividad'));
  }));
  it('la interacción renueva el plazo y no envía una petición por cada movimiento', fakeAsync(() => {
    iniciar();
    for (let i = 0; i < 50; i++) window.dispatchEvent(new Event('pointermove'));
    tick(10000);
    http.expectOne(r => r.url.endsWith('/actividad')).flush({ expiresAt: Date.now() + plazo, idleTimeoutMs: plazo });
    const expiracion = auth.getSessionExpiresAt();
    tick(10000);
    http.expectNone(r => r.url.endsWith('/actividad'));
    expect(auth.getSessionExpiresAt()).toBe(expiracion);
  }));
  it('cierra por inactividad desde cualquier pantalla, sin esperar una petición de negocio', fakeAsync(() => {
    iniciar();
    tick(plazo);
    http.expectOne(r => r.url.endsWith('/session')).flush({}, { status: 401, statusText: 'Expired' });
    expect(auth.hasToken()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));
  it('la actividad de otra pestaña actualiza el vencimiento compartido', fakeAsync(() => {
    iniciar();
    const nuevo = Date.now() + 2 * plazo;
    window.dispatchEvent(new StorageEvent('storage', { key: 'session_expires_at', newValue: String(nuevo) }));
    expect(auth.getSessionExpiresAt()).toBe(nuevo);
    window.dispatchEvent(new StorageEvent('storage', { key: 'session_expires_at', newValue: null }));
    expect(auth.hasToken()).toBeFalse();
  }));
  it('conserva la pantalla de trabajo como destino después de la expiración', fakeAsync(() => {
    router.url = '/casos/alerta-expediente/caso-123';
    iniciar(); tick(plazo);
    http.expectOne(r => r.url.endsWith('/session')).flush({}, { status: 401, statusText: 'Expired' });
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/casos/alerta-expediente/caso-123', sessionExpired: '1' },
    });
  }));
});
