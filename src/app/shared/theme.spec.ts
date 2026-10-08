import { ChartComponent } from 'ng-apexcharts';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth-service/auth.service';
import { ThemeService } from './theme.service';
import SettingsComponent from './settings/settings.component';
import { TablaExpedientesComponent } from '../busquedas/components/tabla-expedientes.component';
import { ExpedienteDialogComponent } from '../busquedas/components/expediente-dialog.component';
import { BusquedaService } from '../busquedas/search-profile/busqueda.service';
import { SidenavComponent } from './sidenav/sidenav.component';
import { CaratulaService } from '../caratulas/caratula.service';
import { SharedService } from './shared.service';
import EstadisticsComponent from '../dashboard/estadistics/estadistics.component';
import { DashboardService } from '../dashboard/estadistics/dashboard.service';
import ChangePasswordComponent from '../auth/pages/change-password/change-password.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { BandejaAccesosService } from '../busquedas/bandeja-accesos.service';

describe('Tema oscuro V3', () => {
  let original: string | null;
  const caso = { _id: 'caso', tipo: 'Maltrato', numeroDeic: 'DEIC-1', acceso: 'AUTORIZADO', victimas: [], seguimientos: [], fileUrls: [] };
  beforeEach(() => {
    original = localStorage.getItem('dark-theme');
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideNoopAnimations(),
      { provide: AuthService, useValue: { getCurrentUser: () => ({ role: 'Investigador', email: 'prueba@example.test' }), hasRole: () => false } },
      { provide: BusquedaService, useValue: { detalle: () => of(caso) } },
      { provide: CaratulaService, useValue: { pendientesCount$: of(0), refreshPendientesCount: () => {} } },
      { provide: SharedService, useValue: { getUserData: () => of({ email: 'prueba@example.test', role: 'Investigador' }) } },
      { provide: DashboardService, useValue: {} },
      { provide: BandejaAccesosService, useValue: { estado$: of({ solicitudes: [], error: false }) } },
    ] });
  });
  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    TestBed.inject(ThemeService).set(original === 'true');
    if (original === null) localStorage.removeItem('dark-theme');
  });
  it('cambia superficies y texto de Configuraciones y restaura el tema claro', () => {
    const theme = TestBed.inject(ThemeService);
    theme.set(false);
    const f = TestBed.createComponent(SettingsComponent);
    f.detectChanges();
    const card = f.nativeElement.querySelector('.section-card');
    expect(getComputedStyle(card).backgroundColor).toBe('rgb(255, 255, 255)');
    theme.set(true); f.detectChanges();
    expect(getComputedStyle(card).backgroundColor).toBe('rgb(30, 41, 59)');
    expect(getComputedStyle(f.nativeElement.querySelector('h2')).color).toBe('rgb(241, 245, 249)');
    expect(localStorage.getItem('dark-theme')).toBe('true');
    theme.set(false); f.detectChanges();
    expect(getComputedStyle(card).backgroundColor).toBe('rgb(255, 255, 255)');
  });
  it('adapta el sidenav expandido y colapsado, incluido su pie y menú de cuenta', async () => {
    const theme = TestBed.inject(ThemeService);
    theme.set(false);
    const f = TestBed.createComponent(SidenavComponent);
    f.componentRef.setInput('collapsed', false); f.detectChanges();
    const sidebar = f.nativeElement.querySelector('.sidebar');
    expect(getComputedStyle(sidebar).backgroundColor).toBe('rgb(255, 255, 255)');
    theme.set(true); f.detectChanges();
    expect(getComputedStyle(sidebar).backgroundColor).toBe('rgb(30, 41, 59)');
    expect(getComputedStyle(f.nativeElement.querySelector('.brand-title')).color).toBe('rgb(241, 245, 249)');
    expect(getComputedStyle(f.nativeElement.querySelector('.sidebar-footer')).backgroundColor).not.toBe('rgb(252, 252, 253)');
    const menu = f.debugElement.query(By.directive(MatMenuTrigger)).injector.get(MatMenuTrigger);
    menu.openMenu(); f.detectChanges(); await f.whenStable();
    const panel = document.querySelector('.user-menu')!;
    expect(getComputedStyle(panel).backgroundColor).toBe('rgb(30, 41, 59)');
    expect(getComputedStyle(panel).borderRadius).toBe('16px');
    expect(panel.querySelectorAll('.user-menu-copy').length).toBe(3);
    theme.set(false); f.detectChanges();
    expect(getComputedStyle(panel).backgroundColor).toBe('rgb(255, 255, 255)');
    menu.closeMenu(); theme.set(true); f.detectChanges(); await f.whenStable();
    f.componentRef.setInput('collapsed', true); f.detectChanges();
    expect(getComputedStyle(sidebar).backgroundColor).toBe('rgb(30, 41, 59)');
  });
  it('adapta Cambiar contraseña y muestra el error de confirmación', async () => {
    const theme = TestBed.inject(ThemeService); theme.set(true);
    const f = TestBed.createComponent(ChangePasswordComponent); f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    expect(getComputedStyle(el.querySelector('.password-card')!).backgroundColor).toBe('rgb(30, 41, 59)');
    f.componentInstance.form.setValue({ currentPassword: 'actual-prueba', newPassword: 'nueva-prueba', confirmPassword: 'distinta-prueba' });
    f.componentInstance.form.markAllAsTouched(); f.detectChanges(); await f.whenStable(); f.detectChanges();
    expect(el.textContent).toContain('Las contraseñas no coinciden.');
    expect((el.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBeTrue();
    f.componentInstance.form.controls.confirmPassword.setValue('nueva-prueba'); f.detectChanges();
    expect((el.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBeFalse();
    (el.querySelector('[aria-label="Mostrar nueva contraseña"]') as HTMLButtonElement).click(); f.detectChanges();
    expect(el.querySelector('input[formControlName="newPassword"]')!.getAttribute('type')).toBe('text');
    theme.set(false); f.detectChanges();
    expect(getComputedStyle(el.querySelector('.password-card')!).backgroundColor).toBe('rgb(255, 255, 255)');
  });
  it('adapta las superficies de Estadísticas y transmite el tema a las gráficas', async () => {
    spyOn(EstadisticsComponent.prototype, 'ngOnInit').and.stub();
    // Verify bindings without starting the third-party asynchronous renderer.
    spyOn(ChartComponent.prototype, 'ngOnChanges').and.stub();
    const theme = TestBed.inject(ThemeService);
    const f = TestBed.createComponent(EstadisticsComponent);
    let mode = '';
    const sub = f.componentInstance.chartTheme$.subscribe(t => mode = t.mode);
    theme.set(true); f.detectChanges();
    await f.whenStable();
    expect(mode).toBe('dark');
    const charts = f.debugElement.queryAll(By.directive(ChartComponent));
    expect(charts.length).toBe(3);
    charts.forEach(c => expect(c.componentInstance.theme().mode).toBe('dark'));
    expect(getComputedStyle(f.nativeElement.querySelector('.dashboard-header')).backgroundColor).toBe('rgb(30, 41, 59)');
    expect(getComputedStyle(f.nativeElement.querySelector('.dashboard-title')).color).toBe('rgb(241, 245, 249)');
    theme.set(false); f.detectChanges();
    await f.whenStable();
    expect(mode).toBe('light');
    charts.forEach(c => expect(c.componentInstance.theme().mode).toBe('light'));
    expect(getComputedStyle(f.nativeElement.querySelector('.dashboard-header')).backgroundColor).toBe('rgb(255, 255, 255)');
    sub.unsubscribe();
  });
  it('aplica colores Material oscuros a las tablas nuevas', () => {
    const theme = TestBed.inject(ThemeService);
    theme.set(false);
    const f = TestBed.createComponent(TablaExpedientesComponent);
    f.componentRef.setInput('casos', [caso]); f.detectChanges();
    const tabla = f.nativeElement.querySelector('table');
    const claro = getComputedStyle(tabla).backgroundColor;
    theme.set(true); f.detectChanges();
    expect(getComputedStyle(tabla).backgroundColor).not.toBe(claro);
    expect(getComputedStyle(f.nativeElement.querySelector('small')).color).toBe('rgb(203, 213, 225)');
  });
  it('los diálogos abiertos fuera de la página heredan el tema oscuro', () => {
    const theme = TestBed.inject(ThemeService);
    theme.set(false);
    const ref = TestBed.inject(MatDialog).open(ExpedienteDialogComponent, { data: caso });
    ref.componentRef!.changeDetectorRef.detectChanges();
    const surface = document.querySelector('.mat-mdc-dialog-surface')!;
    const claro = getComputedStyle(surface).backgroundColor;
    theme.set(true);
    ref.componentRef!.changeDetectorRef.detectChanges();
    expect(getComputedStyle(surface).backgroundColor).not.toBe(claro);
    expect(getComputedStyle(surface.querySelector('dt')!).color).toBe('rgb(203, 213, 225)');
  });
});
