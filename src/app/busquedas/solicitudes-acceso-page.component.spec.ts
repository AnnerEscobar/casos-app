import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import SolicitudesAccesoPageComponent from './solicitudes-acceso-page.component';
import { BandejaAccesosService, SolicitudBandeja } from './bandeja-accesos.service';
import { BusquedaService } from './search-profile/busqueda.service';
import { SidenavComponent } from '../shared/sidenav/sidenav.component';
import { CaratulaService } from '../caratulas/caratula.service';
import { SharedService } from '../shared/shared.service';
import { AuthService } from '../auth/auth-service/auth.service';

describe('Bandeja de solicitudes y contador', () => {
  const solicitud = (extra: Partial<SolicitudBandeja> = {}): SolicitudBandeja => ({ _id: 's1', casoId: 'c1', tipo: 'alerta', numeroDeic: 'DEIC-1', persona: 'María López', motivo: 'Investigar antecedentes', fechaSolicitud: '2026-10-05', estado: 'PENDIENTE', propia: false, puedeResolver: true, puedeVer: true, puedeRevocar: false, ...extra });
  let estado: BehaviorSubject<{ solicitudes: SolicitudBandeja[]; error: boolean }>;
  let api: { resolver: jasmine.Spy; revocar: jasmine.Spy };
  beforeEach(() => {
    estado = new BehaviorSubject<{ solicitudes: SolicitudBandeja[]; error: boolean }>({ solicitudes: [solicitud(), solicitud({ _id: 's2', propia: true, puedeResolver: false, puedeVer: false, persona: '' }), solicitud({ _id: 's3', estado: 'AUTORIZADA', puedeResolver: false, puedeRevocar: true })], error: false });
    api = { resolver: jasmine.createSpy().and.returnValue(of({})), revocar: jasmine.createSpy().and.returnValue(of({})) };
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideNoopAnimations(),
      { provide: BandejaAccesosService, useValue: { estado$: estado, actualizar: jasmine.createSpy() } },
      { provide: BusquedaService, useValue: api },
      { provide: CaratulaService, useValue: { pendientesCount$: of(0), refreshPendientesCount: () => {} } },
      { provide: SharedService, useValue: { getUserData: () => of({ email: 'prueba@example.test', role: 'Investigador' }) } },
      { provide: AuthService, useValue: { getCurrentUser: () => ({ userId: 'u1', role: 'Investigador' }) } },
    ] });
  });
  it('separa pendientes, propias y vigentes y filtra por persona sin depender de acentos', () => {
    const f = TestBed.createComponent(SolicitudesAccesoPageComponent); f.detectChanges(); const c = f.componentInstance;
    expect(c.visibles.map(s => s._id)).toEqual(['s1']); c.filtro = 'maria'; expect(c.visibles.length).toBe(1);
    c.filtro = ''; c.cambiarTab(1); expect(c.visibles.map(s => s._id)).toEqual(['s2']);
    c.cambiarTab(2); expect(c.visibles.map(s => s._id)).toEqual(['s3']);
    expect(f.nativeElement.querySelector('table')).toBeTruthy();
  });
  it('exige confirmar la acción y respeta las capacidades de cada solicitud', () => {
    const f = TestBed.createComponent(SolicitudesAccesoPageComponent); f.detectChanges(); const c = f.componentInstance;
    c.preparar(estado.value.solicitudes[1], 'AUTORIZADA'); expect(c.confirmacion).toBeNull();
    c.preparar(estado.value.solicitudes[0], 'AUTORIZADA'); expect(api.resolver).not.toHaveBeenCalled();
    c.confirmar(); expect(api.resolver).toHaveBeenCalledOnceWith('s1', 'AUTORIZADA');
    c.preparar(estado.value.solicitudes[2], 'REVOCADA'); c.confirmar(); expect(api.revocar).toHaveBeenCalledOnceWith('s3');
  });
  it('abre el expediente por su id solo si tiene permiso de consulta', () => {
    const f = TestBed.createComponent(SolicitudesAccesoPageComponent); f.detectChanges();
    const abrir = spyOn(TestBed.inject(MatDialog), 'open');
    f.componentInstance.abrir(estado.value.solicitudes[1]); expect(abrir).not.toHaveBeenCalled();
    f.componentInstance.abrir(estado.value.solicitudes[0]); expect(abrir.calls.mostRecent().args[1]?.data).toEqual({ _id: 'c1', tipo: 'alerta' });
  });
  it('muestra el contador expandido y colapsado y lo reduce tras resolver', () => {
    const f = TestBed.createComponent(SidenavComponent); f.componentRef.setInput('collapsed', false); f.detectChanges();
    const item = f.componentInstance.menuItems.find(i => i.title === 'Accesos a expedientes')!;
    expect(f.componentInstance.pendientesDelItem(item)).toBe(1);
    expect(f.nativeElement.querySelector('[aria-label="1 solicitudes pendientes"]')).toBeTruthy();
    f.componentRef.setInput('collapsed', true); f.detectChanges(); expect(f.nativeElement.querySelector('.collapsed-badge').textContent.trim()).toBe('1');
    estado.next({ solicitudes: [], error: false }); f.detectChanges(); expect(f.nativeElement.querySelector('.collapsed-badge')).toBeNull();
  });
});
