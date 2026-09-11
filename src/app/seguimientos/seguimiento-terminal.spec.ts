import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth-service/auth.service';
import { CasoSeguimiento, SeguimientoCaso, TipoCaso } from '../casos/models/caso-historico.model';
import SeguimientoAlertaComponent from './seguimiento-alerta/seguimiento-alerta.component';
import SeguimientoMaltratoComponent from './seguimiento-maltrato/seguimiento-maltrato.component';
import SeguimientoConflictoComponent from './seguimiento-conflicto/seguimiento-conflicto.component';
import { estaCerrado } from './seguimiento-terminal';
import { SeguimientoParticipantesComponent } from './seguimiento-participantes.component';

const tipos: { tipo: TipoCaso; component: Type<SeguimientoMaltratoComponent>; numero: string; terminal: string }[] = [
  { tipo: 'alerta', component: SeguimientoAlertaComponent as unknown as Type<SeguimientoMaltratoComponent>, numero: 'DEIC52-2016-05-18-421', terminal: 'Concluido' },
  { tipo: 'maltrato', component: SeguimientoMaltratoComponent, numero: 'DEIC51-2016-05-18-421', terminal: 'Desestimado' },
  { tipo: 'conflicto', component: SeguimientoConflictoComponent as unknown as Type<SeguimientoMaltratoComponent>, numero: 'DEIC53-2016-05-18-421', terminal: 'Desestimado' },
];

describe('Seguimientos: cierre y línea de tiempo', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    history.replaceState({}, '');
    const karma = (window as unknown as { __karma__: { config: { args?: string[] } } }).__karma__;
    const ancho = Number(karma.config.args?.[0]);
    if (ancho && window.frameElement) (window.frameElement as HTMLElement).style.width = `${ancho}px`;
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), provideRouter([]), { provide: AuthService, useValue: { hasRole: () => true } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  for (const config of tipos) {
    const seg = (estado: string, fecha = '2026-09-10T21:03:00Z'): SeguimientoCaso => ({ [config.tipo === 'alerta' ? 'nuevoEstado' : 'estado']: estado, fecha, archivos: [] });
    function abrir(seguimientos?: SeguimientoCaso[], origenCaso: 'SISTEMA' | 'HISTORICO' = 'SISTEMA') {
      const fixture = TestBed.createComponent(config.component);
      fixture.detectChanges();
      fixture.componentInstance.seleccionarCaso({ numeroDeic: config.numero, seguimientos, origenCaso });
      fixture.detectChanges();
      for (const req of http.match(r => r.url.endsWith('/auth/investigadores'))) req.flush([]);
      return fixture;
    }
    function enviar(fixture: ReturnType<typeof abrir>, estado: string) {
      const c = fixture.componentInstance;
      c.seguimientoForm.patchValue({ nuevoEstado: estado });
      c.investigadorAsignado.setValue('507f1f77bcf86cd799439011');
      if (config.tipo !== 'alerta') c.selectedFile = new File(['pdf'], 'actuacion.pdf');
      c.enviarSeguimiento();
      return http.expectOne(r => r.method === 'PATCH');
    }

    it(`${config.tipo}: sin seguimientos e Informado muestran Nuevo seguimiento`, () => {
      const f = abrir();
      expect(f.nativeElement.textContent).toContain('Nuevo seguimiento');
      f.componentInstance.seleccionarCaso({ numeroDeic: config.numero, seguimientos: [seg('Informado')] }); f.detectChanges();
      expect(f.nativeElement.textContent).toContain('Nuevo seguimiento');
    });

    for (const origen of ['SISTEMA', 'HISTORICO'] as const) {
      it(`${config.tipo} ${origen}: Informado repetido, cierre y bloqueo inmediato`, () => {
        const f = abrir([seg('Informado')], origen);
        enviar(f, 'Informado').flush({ seguimiento: seg('Informado') }); f.detectChanges();
        expect(f.nativeElement.querySelectorAll('.v3-timeline-item').length).toBe(2);
        expect(f.nativeElement.textContent).toContain('Nuevo seguimiento');
        enviar(f, config.terminal).flush({ seguimiento: seg(config.terminal) }); f.detectChanges();
        expect(f.nativeElement.querySelectorAll('.v3-timeline-item').length).toBe(3);
        expect(f.nativeElement.textContent).not.toContain('Nuevo seguimiento');
        expect(f.nativeElement.querySelector('input[type=file]')).toBeNull();
        expect(f.nativeElement.querySelector('app-responsable-seguimiento')).toBeNull();
        expect(f.nativeElement.textContent).toContain(config.tipo === 'alerta' ? 'Alerta concluida' : 'Caso desestimado');
        f.componentInstance.enviarSeguimiento(); http.expectNone(r => r.method === 'PATCH');
      });
    }

    it(`${config.tipo}: nueva instancia obtiene cierre desde HTTP y conserva historial`, () => {
      const f = TestBed.createComponent(config.component); f.detectChanges();
      f.componentInstance.seguimientoForm.patchValue({ numeroDeic: config.numero }); f.componentInstance.buscarCaso();
      http.expectOne(r => r.method === 'GET').flush({ numeroDeic: config.numero, seguimientos: [seg(config.terminal)] });
      f.detectChanges();
      expect(f.nativeElement.textContent).not.toContain('Nuevo seguimiento');
      expect(f.nativeElement.querySelectorAll('.v3-timeline-item').length).toBe(1);
    });

    it(`${config.tipo}: cierre antiguo no bloquea; conserva el orden persistido con fechas repetidas`, () => {
      const f = abrir([seg(config.terminal), seg('Informado'), seg('Informado')]);
      expect(f.componentInstance.casoCerrado).toBeFalse();
      expect(f.nativeElement.textContent).toContain('Nuevo seguimiento');
      expect(f.componentInstance.seguimientos.map(s => s.nuevoEstado || s.estado)).toEqual([config.terminal, 'Informado', 'Informado']);
    });

    it(`${config.tipo}: 409 refresca el historial y retira el formulario`, () => {
      const f = abrir([seg('Informado')]);
      enviar(f, 'Informado').flush({ message: 'El expediente está cerrado', code: 'SEGUIMIENTO_TERMINAL' }, { status: 409, statusText: 'Conflict' });
      http.expectOne(r => r.method === 'GET').flush({ numeroDeic: config.numero, seguimientos: [seg('Informado'), seg(config.terminal)] });
      f.detectChanges();
      expect(f.componentInstance.submitting).toBeFalse();
      expect(f.nativeElement.textContent).not.toContain('Nuevo seguimiento');
      expect(f.componentInstance.seguimientos.length).toBe(2);
    });

    it(`${config.tipo}: si falla el refresco 409 conserva expediente y bloquea otro envío`, () => {
      const f = abrir([seg('Informado')]);
      enviar(f, 'Informado').flush({}, { status: 409, statusText: 'Conflict' });
      http.expectOne(r => r.method === 'GET').flush({}, { status: 404, statusText: 'Not found' });
      f.detectChanges();
      expect(f.componentInstance.casoEncontrado?.numeroDeic).toBe(config.numero);
      expect(f.nativeElement.textContent).toContain('Verificación del expediente');
      expect(f.nativeElement.textContent).not.toContain('Nuevo seguimiento');
    });

    it(`${config.tipo}: distingue actuaciones y adjuntos sin desbordar el historial`, () => {
      const f = abrir([0, 1, 2].map(i => ({ ...seg('Informado', `2026-09-${10 + i}T21:03:00Z`), investigadorAsignado: { _id: 'p', nombre: 'Pedro ' + 'López'.repeat(15) }, registradoPor: { _id: 'm', nombre: 'María López' }, archivos: Array(i).fill('https://example.test/documento.pdf') })));
      expect(f.nativeElement.querySelectorAll('.v3-timeline-item').length).toBe(3);
      expect(f.nativeElement.textContent).toContain('Investigador: Pedro');
      expect(f.nativeElement.textContent).toContain('Registrado por: María López');
      expect(f.nativeElement.querySelectorAll('.v3-file-count').length).toBe(2);
      for (const item of Array.from(f.nativeElement.querySelectorAll('.v3-timeline-item')) as HTMLElement[]) {
        expect(item.scrollWidth).toBeLessThanOrEqual(item.clientWidth + 1);
        expect(item.getBoundingClientRect().right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
      }
    });
  }

  it('Alerta Remitido cierra y no incorpora Desestimado a sus opciones', () => {
    const f = TestBed.createComponent(SeguimientoAlertaComponent); f.detectChanges();
    f.componentInstance.seleccionarCaso({ numeroDeic: tipos[0].numero, seguimientos: [{ nuevoEstado: 'Remitido' }] }); f.detectChanges();
    expect(f.nativeElement.textContent).not.toContain('Nuevo seguimiento');
    expect(f.nativeElement.textContent).toContain('Alerta remitida');
    expect(f.componentInstance.estados.map(e => e.value)).toEqual(['Informado', 'Remitido', 'Concluido']);
    expect(estaCerrado('alerta', [{ nuevoEstado: 'Desestimado' }])).toBeFalse();
    expect(estaCerrado('maltrato', [{ estado: 'Concluido' }])).toBeFalse();
    expect(estaCerrado('conflicto', null)).toBeFalse();
  });

  it('no duplica al registrador si es el responsable y no inventa datos ausentes', () => {
    const f = TestBed.createComponent(SeguimientoParticipantesComponent);
    f.componentRef.setInput('seguimiento', { investigadorAsignado: { _id: 'p', nombre: 'Pedro' }, registradoPor: { _id: 'p', nombre: 'Pedro' } }); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Investigador: Pedro');
    expect(f.nativeElement.textContent).not.toContain('Registrado por');
    f.componentRef.setInput('seguimiento', {}); f.detectChanges();
    expect(f.nativeElement.textContent.trim()).toBe('');
  });
});
