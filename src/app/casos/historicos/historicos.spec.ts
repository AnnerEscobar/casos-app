import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter, Type } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import AddCaseAlertaComponent from '../pages/add-case-alerta/add-case-alerta.component';
import AddCaseMaltratoComponent from '../pages/add-case-maltrato/add-case-maltrato.component';
import AddCaseConflictoComponent from '../pages/add-case-conflicto/add-case-conflicto.component';
import SeguimientoAlertaComponent from '../../seguimientos/seguimiento-alerta/seguimiento-alerta.component';
import SeguimientoMaltratoComponent from '../../seguimientos/seguimiento-maltrato/seguimiento-maltrato.component';
import SeguimientoConflictoComponent from '../../seguimientos/seguimiento-conflicto/seguimiento-conflicto.component';
import { HistoricoFormulario, normalizarNumeroCaso } from './historico-formulario';
import { HistoricoInfoComponent } from './historico-info.component';
import { IncorporarHistoricoDialogComponent } from './incorporar-historico-dialog.component';
import { AuthService } from '../../auth/auth-service/auth.service';
import { UserRole } from '../../auth/enums/user-role.enum';
import { CasoSeguimiento, TipoCaso } from '../models/caso-historico.model';

interface Registro {
  myForm: FormGroup; historico: HistoricoFormulario; modoHistorico: boolean;
  numeroDeicInicial: string; isLoading: boolean; historicoCreado: EventEmitter<CasoSeguimiento>;
  selectedFile: File | null; fileName: string | null;
  onFileSelected(event: Event): void;
  registrarCaso(): void; agregarVictima?(): void; victimas?: FormArray;
  infractores?: FormArray;
}
const investigadores = [{ _id: '507f1f77bcf86cd799439011', nombre: 'Pedro', role: 'Investigador', activo: true },
  { _id: '507f1f77bcf86cd799439012', nombre: 'Juan', role: 'Investigador', activo: false }];
const configs: { tipo: TipoCaso; numero: string; component: Type<Registro> }[] = [
  { tipo: 'alerta', numero: 'DEIC52-2016-05-18-421', component: AddCaseAlertaComponent },
  { tipo: 'maltrato', numero: 'DEIC51-2016-05-18-421', component: AddCaseMaltratoComponent },
  { tipo: 'conflicto', numero: 'DEIC53-2016-05-18-421', component: AddCaseConflictoComponent },
];

// Chrome impone un ancho mínimo de ventana en Windows. Ajustar su iframe de
// pruebas permite verificar media queries a 390px reales, sin alterar la app.
beforeEach(() => {
  const karma = (window as unknown as { __karma__: { config: { args?: string[] } } }).__karma__;
  const ancho = Number(karma.config.args?.[0]);
  if (ancho && window.frameElement) {
    (window.frameElement as HTMLElement).style.width = `${ancho}px`;
    expect(window.innerWidth).toBe(ancho);
  }
});

describe('Históricos: formularios reutilizados', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    history.replaceState({}, '');
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function abrir(config: typeof configs[number], historico = true): ComponentFixture<Registro> {
    const fixture = TestBed.createComponent(config.component);
    fixture.componentRef.setInput('modoHistorico', historico);
    fixture.componentRef.setInput('numeroDeicInicial', config.numero);
    fixture.detectChanges();
    if (historico) http.expectOne(r => r.url.endsWith('/auth/investigadores')).flush(investigadores);
    return fixture;
  }

  for (const config of configs) {
    it(`${config.tipo}: crea NO_LOCALIZADO sin personas ni PDF, solo datos reales`, () => {
      const fixture = abrir(config); const c = fixture.componentInstance;
      c.historico.datos.patchValue({ estadoExpedienteHistorico: 'NO_LOCALIZADO', fuenteInformacionHistorica: 'NUEVO_REQUERIMIENTO', observacionHistorica: 'Expediente original no localizado.' });
      fixture.detectChanges();
      expect(c.myForm.valid).toBeTrue();
      expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('adjunta el PDF');
      expect(fixture.nativeElement.querySelector('[formControlName="nombreDesaparecido"]')).toBeNull();
      const emit = spyOn(c.historicoCreado, 'emit');
      c.registrarCaso(); c.registrarCaso();
      const req = http.expectOne(r => r.url.endsWith(`/${config.tipo}s/historico`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ numeroDeic: config.numero, origenCaso: 'HISTORICO', estadoExpedienteHistorico: 'NO_LOCALIZADO', fuenteInformacionHistorica: 'NUEVO_REQUERIMIENTO', observacionHistorica: 'Expediente original no localizado.' });
      expect(c.isLoading).toBeTrue();
      const creado: CasoSeguimiento = { ...req.request.body, _id: 'id-creado', estadoRegistro: 'Pendiente' };
      req.flush(creado);
      expect(emit).toHaveBeenCalledWith(creado);
      expect(c.isLoading).toBeFalse();
    });

    for (const estado of ['COMPLETO', 'PARCIAL'] as const) {
      it(`${config.tipo}: ${estado} reutiliza el selector y envía el PDF del caso en multipart`, () => {
        const fixture = abrir(config); const c = fixture.componentInstance;
        c.historico.datos.patchValue({ estadoExpedienteHistorico: estado, anioCaso: 2016, investigadorOriginal: { nombre: 'Investigador original' } });
        fixture.detectChanges();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=file]');
        expect(input).not.toBeNull();
        expect(input.closest('section')?.textContent).toContain('Opcional');
        const file = new File(['%PDF-1.4\n'], 'expediente-2016.pdf', { type: 'application/pdf' });
        const files = new DataTransfer(); files.items.add(file); input.files = files.files;
        input.dispatchEvent(new Event('change'));
        expect(c.selectedFile).toBe(file);
        c.registrarCaso();
        const req = http.expectOne(r => r.url.endsWith(`/${config.tipo}s/historico`));
        const body: FormData = req.request.body;
        expect(body instanceof FormData).toBeTrue();
        expect((body.get('file') as File).name).toBe(file.name);
        expect((body.get('file') as File).size).toBe(file.size);
        expect((body.get('file') as File).type).toBe('application/pdf');
        expect(body.get('numeroDeic')).toBe(config.numero);
        expect(body.get('estadoExpedienteHistorico')).toBe(estado);
        expect(body.get('anioCaso')).toBe('2016');
        expect(JSON.parse(String(body.get('investigadorOriginal')))).toEqual({ nombre: 'Investigador original' });
        expect(body.has('seguimientos')).toBeFalse();
        req.flush({ numeroDeic: config.numero });
      });
    }

    it(`${config.tipo}: COMPLETO → NO_LOCALIZADO limpia el PDF y PARCIAL muestra el selector vacío`, () => {
      const fixture = abrir(config); const c = fixture.componentInstance;
      c.historico.datos.controls.estadoExpedienteHistorico.setValue('COMPLETO');
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=file]');
      const files = new DataTransfer(); files.items.add(new File(['%PDF-1.4'], 'expediente.pdf', { type: 'application/pdf' }));
      input.files = files.files; input.dispatchEvent(new Event('change'));
      c.historico.datos.controls.estadoExpedienteHistorico.setValue('NO_LOCALIZADO');
      fixture.detectChanges();
      expect(c.selectedFile).toBeNull(); expect(c.fileName).toBeNull();
      expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
      c.registrarCaso();
      const req = http.expectOne(r => r.url.endsWith(`/${config.tipo}s/historico`));
      expect(req.request.body.file).toBeUndefined();
      req.flush({ numeroDeic: config.numero });
      c.historico.datos.controls.estadoExpedienteHistorico.setValue('PARCIAL'); fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input[type=file]').value).toBe('');
    });

    it(`${config.tipo}: COMPLETO y PARCIAL aceptan datos omitidos, pero validan identificadores`, () => {
      const fixture = abrir(config); const c = fixture.componentInstance;
      for (const estado of ['COMPLETO', 'PARCIAL'] as const) {
        c.historico.datos.controls.estadoExpedienteHistorico.setValue(estado);
        fixture.detectChanges();
        expect(c.myForm.valid).toBeTrue();
        c.myForm.get('numeroMp')?.setValue('incorrecto');
        expect(c.myForm.invalid).toBeTrue();
        c.myForm.get('numeroMp')?.setValue('');
      }
      if (config.tipo === 'alerta') {
        c.myForm.get('estadoInvestigacion')?.setValue('Remitido');
        expect(c.myForm.get('denunciante')?.valid).toBeTrue();
        expect(c.myForm.get('datosLocalizacion')?.valid).toBeTrue();
      } else {
        c.agregarVictima?.();
        c.victimas?.at(0).patchValue({ nombre: 'Persona conocida' });
        expect(c.myForm.valid).toBeTrue();
        const payload = c.historico.payload(c.myForm, config.tipo);
        expect(payload.victimas).toEqual([{ nombre: 'Persona conocida' }]);
        expect(payload.infractores).toBeUndefined(); expect(payload.sindicados).toBeUndefined();
        c.myForm.get('numeroDeic')?.setValue('');
        expect(c.myForm.invalid).toBeTrue();
      }
      if (config.tipo === 'conflicto') {
        expect(fixture.nativeElement.textContent).toContain('Infractores');
        expect(fixture.nativeElement.textContent).not.toContain('Sindicado');
      }
    });

    it(`${config.tipo}: al cambiar a mínimo no envía campos ocultos ni borra lo escrito`, () => {
      const fixture = abrir(config); const c = fixture.componentInstance;
      c.historico.datos.controls.estadoExpedienteHistorico.setValue('PARCIAL');
      c.myForm.get('estadoInvestigacion')?.setValue('Informado');
      c.historico.datos.controls.estadoExpedienteHistorico.setValue('NO_LOCALIZADO');
      expect(c.historico.payload(c.myForm, config.tipo).estadoInvestigacion).toBeUndefined();
      c.historico.datos.controls.estadoExpedienteHistorico.setValue('PARCIAL');
      expect(c.myForm.get('estadoInvestigacion')?.value).toBe('Informado');
    });

    it(`${config.tipo}: no restaura el borrador normal al incorporar un histórico`, () => {
      sessionStorage.setItem(`draft:add-case-${config.tipo}`, JSON.stringify({ value: { numeroDeic: 'OTRO', numeroMp: 'OTRO' } }));
      const fixture = abrir(config);
      expect(fixture.componentInstance.myForm.value.numeroDeic).toBe(config.numero);
      expect(fixture.componentInstance.myForm.value.numeroMp).toBe('');
    });

    it(`${config.tipo}: el registro normal conserva sus requeridos y el PDF`, () => {
      const fixture = abrir(config, false); const c = fixture.componentInstance;
      c.myForm.patchValue({ numeroDeic: config.numero });
      expect(c.myForm.invalid).toBeTrue();
      expect(c.myForm.get('numeroMp')?.hasError('required')).toBeTrue();
      expect(c.myForm.get('estadoInvestigacion')?.hasError('required')).toBeTrue();
      expect(fixture.nativeElement.querySelector('app-historico-data')).toBeNull();
      expect(fixture.nativeElement.querySelector('input[type=file]')).not.toBeNull();
      c.registrarCaso(); http.expectNone(r => r.method === 'POST');
    });

    it(`${config.tipo}: 409 y 403 no pierden datos ni dejan Guardar bloqueado`, () => {
      const fixture = abrir(config); const c = fixture.componentInstance;
      const snack = spyOn(TestBed.inject(MatSnackBar), 'open');
      c.historico.datos.patchValue({ estadoExpedienteHistorico: 'NO_LOCALIZADO', observacionHistorica: 'Conservar' });
      for (const status of [409, 403]) {
        c.registrarCaso();
        http.expectOne(r => r.url.endsWith('/historico')).flush({}, { status, statusText: 'Error' });
        expect(c.isLoading).toBeFalse();
        expect(c.historico.datos.value.observacionHistorica).toBe('Conservar');
      }
      expect(snack.calls.allArgs().some(args => args[0].includes('ya se encuentra registrado'))).toBeTrue();
      expect(snack.calls.allArgs().some(args => args[0].includes('permisos'))).toBeTrue();
    });

    it(`${config.tipo}: cards y campos caben en el viewport actual`, () => {
      const fixture = abrir(config);
      fixture.componentInstance.historico.datos.controls.estadoExpedienteHistorico.setValue('PARCIAL');
      fixture.detectChanges();
      const viewport = document.documentElement.clientWidth;
      console.info(`Responsive ${config.tipo}: viewport ${viewport}px`);
      for (const el of Array.from(fixture.nativeElement.querySelectorAll('.v3-card, mat-form-field')) as HTMLElement[]) {
        const rect = el.getBoundingClientRect();
        expect(rect.width).toBeGreaterThan(100);
        expect(rect.right).withContext(`${el.tagName}, ancho ${viewport}`).toBeLessThanOrEqual(viewport + 1);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      }
    });
  }
});

describe('Históricos: continuidad del seguimiento', () => {
  let http: HttpTestingController;
  let rol = UserRole.INVESTIGADOR;
  beforeEach(() => {
    history.replaceState({}, ''); rol = UserRole.INVESTIGADOR;
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), provideRouter([]),
      { provide: AuthService, useValue: { hasRole: (r: UserRole) => r === rol } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { TestBed.inject(MatDialog).closeAll(); http.verify(); });

  const seguimientos = [SeguimientoAlertaComponent, SeguimientoMaltratoComponent, SeguimientoConflictoComponent];
  for (const [index, componente] of seguimientos.entries()) {
    const config = configs[index];
    it(`${config.tipo}: WhatsApp, caso existente, 404 real y error de red`, () => {
      const fixture = TestBed.createComponent(componente as Type<SeguimientoMaltratoComponent>);
      fixture.detectChanges(); const c = fixture.componentInstance;
      c.seguimientoForm.patchValue({ numeroDeic: '\u200E ' + config.numero + '\u200F' }); c.buscarCaso();
      http.expectOne(r => r.method === 'GET').flush({ numeroDeic: config.numero });
      expect(c.casoEncontrado?.numeroDeic).toBe(config.numero);
      expect(c.numeroNoEncontrado).toBe('');
      c.buscarCaso(); http.expectOne(r => r.method === 'GET').flush({}, { status: 500, statusText: 'Error' });
      expect(c.numeroNoEncontrado).toBe('');
      c.buscarCaso(); http.expectOne(r => r.method === 'GET').flush({}, { status: 404, statusText: 'No encontrado' });
      expect(c.numeroNoEncontrado).toBe(config.numero);
      rol = UserRole.JEFE; fixture.detectChanges();
      expect(c.puedeIncorporar).toBeFalse();
    });

    it(`${config.tipo}: crear en diálogo selecciona el caso pendiente sin una segunda búsqueda`, async () => {
      const fixture = TestBed.createComponent(componente as Type<SeguimientoMaltratoComponent>);
      fixture.detectChanges(); const c = fixture.componentInstance;
      c.numeroNoEncontrado = config.numero;
      await c.incorporarHistorico();
      const ref = TestBed.inject(MatDialog).openDialogs[0];
      expect(ref.componentInstance instanceof IncorporarHistoricoDialogComponent).toBeTrue();
      await fixture.whenStable();
      for (const req of http.match(r => r.url.endsWith('/auth/investigadores'))) req.flush(investigadores);
      const dialog = document.querySelector('mat-dialog-container') as HTMLElement;
      const rect = dialog.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(100);
      expect(rect.right).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
      expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth + 1);
      const caso: CasoSeguimiento = { _id: 'creado', numeroDeic: config.numero, origenCaso: 'HISTORICO', estadoRegistro: 'Pendiente' };
      ref.close(caso); await fixture.whenStable(); fixture.detectChanges();
      expect(c.casoEncontrado?._id).toBe('creado');
      expect(c.seguimientoForm.value.numeroDeic).toBe(config.numero);
      expect(c.investigadorAsignado.value).toBe('');
      expect(c.investigadorAsignado.invalid).toBeTrue();
      http.expectNone(r => r.url.includes(config.numero));
      for (const req of http.match(r => r.url.endsWith('/auth/investigadores'))) req.flush(investigadores);
    });

    it(`${config.tipo}: registra seguimiento sin atribuirlo al investigador original ni reconsultar el pendiente`, () => {
      const fixture = TestBed.createComponent(componente as Type<SeguimientoMaltratoComponent>);
      fixture.detectChanges(); const c = fixture.componentInstance;
      c.seleccionarCaso({ numeroDeic: config.numero, origenCaso: 'HISTORICO', estadoRegistro: 'Pendiente', investigadorOriginal: { nombre: 'Juan' } });
      c.seguimientoForm.patchValue({ nuevoEstado: 'Informado' });
      c.enviarSeguimiento(); http.expectNone(r => r.method === 'PATCH');
      c.investigadorAsignado.setValue(investigadores[0]._id);
      if (config.tipo !== 'alerta') c.selectedFile = new File(['%PDF-1.4'], 'respaldo.pdf', { type: 'application/pdf' });
      c.enviarSeguimiento(); c.enviarSeguimiento();
      const req = http.expectOne(r => r.method === 'PATCH');
      expect((req.request.body as FormData).get('investigadorAsignado')).toBe(investigadores[0]._id);
      expect((req.request.body as FormData).has('registradoPor')).toBeFalse();
      req.flush({ seguimiento: { fecha: '2026-01-01', estado: 'Informado', archivos: [] } });
      expect(c.casoEncontrado?.seguimientos?.length).toBe(1);
      expect(c.casoEncontrado?.investigadorOriginal?.nombre).toBe('Juan');
      http.expectNone(r => r.method === 'GET');
    });
  }

  it('caso antiguo sin origen no presenta metadatos ni lanza errores', () => {
    const f = TestBed.createComponent(HistoricoInfoComponent);
    f.componentRef.setInput('caso', { numeroDeic: 'MT000001' }); f.detectChanges();
    expect(f.nativeElement.querySelector('section')).toBeNull();
    f.componentRef.setInput('caso', { origenCaso: 'HISTORICO', registradoPor: { _id: 'u', nombre: 'María' } }); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No determinado');
    expect(f.nativeElement.textContent).toContain('María');
  });
  it('normalización conserva los identificadores válidos', () => {
    expect(normalizarNumeroCaso('\uFEFF\u202A deic51-2016-05-18-421\u2069')).toBe('DEIC51-2016-05-18-421');
    expect(normalizarNumeroCaso('IC/PNCORLLAT123-2016-42')).toBe('IC/PNCORLLAT123-2016-42');
  });
});
