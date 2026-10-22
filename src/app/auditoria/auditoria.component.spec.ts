import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';
import AuditoriaComponent from './auditoria.component';
import { AuditoriaService, EventoAuditoria, PaginaAuditoria } from './auditoria.service';
import { routes } from '../app.routes';
import { UserRole } from '../auth/enums/user-role.enum';

const evento: EventoAuditoria = {
  eventoId: 'evento-123', solicitudId: 'solicitud-456', fecha: '2026-10-22T16:35:42.123Z',
  usuario: { id: 'usuario-1', nombre: 'María Pérez', rol: 'Investigador' },
  accion: 'MODIFICAR', resultado: 'EXITOSO', recurso: 'CasosAlerta', recursoId: 'caso-1', numeroDeic: 'DEIC-1',
  metodo: 'PATCH', ruta: '/alertas/seguimiento/DEIC-1', ip: '127.0.0.1', agente: 'Chrome', integridadValida: true,
  cambios: [{ campo: 'estadoInvestigacion', anterior: 'Localizado', nuevo: 'Remitido' }],
};
const pagina = (e = evento): PaginaAuditoria => ({ registros: [e], total: 1, pagina: 1, limite: 25 });
describe('Consulta de bitácora', () => {
  let api: { buscar: jasmine.Spy };
  beforeEach(async () => {
    api = { buscar: jasmine.createSpy().and.returnValue(of(pagina())) };
    await TestBed.configureTestingModule({ imports: [AuditoriaComponent], providers: [provideNoopAnimations(), { provide: AuditoriaService, useValue: api }] }).compileComponents();
  });
  function crear() { const fixture = TestBed.createComponent(AuditoriaComponent); fixture.detectChanges(); return fixture; }
  it('muestra responsable, hora de Guatemala, identidad y el cambio exacto en detalle', () => {
    const fixture = crear(); fixture.componentInstance.seleccionado = evento; fixture.detectChanges();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('María Pérez'); expect(texto).toContain('22/10/2026 10:35:42.123');
    expect(texto).toContain('Localizado'); expect(texto).toContain('Remitido'); expect(texto).toContain('solicitud-456');
    expect(texto).toContain('2026-10-22 16:35:42.123 UTC'); expect(texto).toContain('Firma válida');
    expect(fixture.nativeElement.querySelectorAll('input').length).toBeGreaterThan(5);
    expect(texto).not.toContain('Eliminar registro');
  });
  it('envía filtros exactos y convierte fechas de Guatemala sin depender de la zona del navegador', () => {
    const fixture = crear(), c = fixture.componentInstance;
    Object.assign(c.filtros, { numeroDeic: 'DEIC-1', campo: 'estadoInvestigacion', anterior: 'Localizado', nuevo: 'Remitido', desde: '2026-10-22T10:00', hasta: '2026-10-22T11:00' });
    c.buscar();
    expect(api.buscar).toHaveBeenCalledWith(jasmine.objectContaining({ anterior: 'Localizado', nuevo: 'Remitido', desde: '2026-10-22T16:00:00.000Z', hasta: '2026-10-22T17:00:00.000Z' }), 1);
  });
  it('advierte una firma inválida y no presenta el evento como verificado', () => {
    api.buscar.and.returnValue(of(pagina({ ...evento, integridadValida: false })));
    const fixture = crear(); fixture.componentInstance.seleccionado = fixture.componentInstance.registros[0]; fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ALERTA: firma inválida');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('requiere revisión');
  });
  it('no permite rangos invertidos ni peticiones duplicadas durante la carga', () => {
    const fixture = crear(), c = fixture.componentInstance;
    c.filtros['desde'] = '2026-10-23T10:00'; c.filtros['hasta'] = '2026-10-22T10:00';
    c.buscar(); expect(api.buscar).toHaveBeenCalledTimes(1); expect(c.error).toContain('anterior');
    c.filtros['desde'] = ''; c.filtros['hasta'] = '';
    const pendiente = new Subject<PaginaAuditoria>(); api.buscar.and.returnValue(pendiente);
    c.buscar(); c.buscar(); c.cargar(2); expect(api.buscar).toHaveBeenCalledTimes(2);
    pendiente.next(pagina()); pendiente.complete();
  });
  it('mantiene los filtros aplicados al paginar y limpia el detalle', () => {
    const fixture = crear(), c = fixture.componentInstance;
    c.filtros['numeroDeic'] = 'DEIC-1'; c.buscar(); c.filtros['numeroDeic'] = 'sin aplicar'; c.seleccionado = evento;
    c.cargar(2); expect(api.buscar).toHaveBeenCalledWith(jasmine.objectContaining({ numeroDeic: 'DEIC-1' }), 2); expect(c.seleccionado).toBeNull();
  });
  it('limpia resultados anteriores y explica el error de permisos', () => {
    const fixture = crear(), c = fixture.componentInstance;
    api.buscar.and.returnValue(throwError(() => ({ status: 403 }))); c.buscar(); fixture.detectChanges();
    expect(c.registros).toEqual([]); expect(c.total).toBe(0); expect(c.error).toContain('no tiene permiso');
    expect(fixture.nativeElement.textContent).not.toContain('registros encontrados');
  });
  it('presenta estado vacío y vuelve a cargar sin filtros', () => {
    api.buscar.and.returnValue(of({ registros: [], total: 0, pagina: 1, limite: 25 }));
    const fixture = crear(), c = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('No hay registros');
    c.filtros['anterior'] = 'Localizado'; c.limpiar(); expect(c.filtros['anterior']).toBe('');
  });
  it('restringe la ruta a Administrador y Jefe', () => {
    const ruta = routes.find(r => r.path === 'casos')!.children!.find(r => r.path === 'auditoria')!;
    expect(ruta.canActivate!.length).toBe(1); expect(ruta.data!['roles']).toEqual([UserRole.ADMIN, UserRole.JEFE]);
  });
  it('mantiene controles dentro del ancho visible', () => {
    const fixture = crear();
    for (const campo of fixture.nativeElement.querySelectorAll('mat-form-field')) {
      const rect = campo.getBoundingClientRect(); expect(rect.left).toBeGreaterThanOrEqual(0); expect(rect.right).toBeLessThanOrEqual(window.innerWidth + 1);
    }
  });
});

describe('Servicio HTTP de auditoría', () => {
  it('codifica filtros sin interpolarlos como URL y usa solo GET', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const servicio = TestBed.inject(AuditoriaService), http = TestBed.inject(HttpTestingController);
    servicio.buscar({ numeroDeic: ' DEIC / & 1 ', usuario: ' María ' }, 2).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/auditoria'));
    expect(req.request.method).toBe('GET'); expect(req.request.withCredentials).toBeTrue();
    expect(req.request.params.get('numeroDeic')).toBe('DEIC / & 1'); expect(req.request.params.get('usuario')).toBe('María');
    expect(req.request.params.get('pagina')).toBe('2'); req.flush({ registros: [], total: 0, pagina: 2, limite: 25 }); http.verify();
  });
});
