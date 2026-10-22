import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NuevaDocumentacionComponent } from './nueva-documentacion.component';
import { DocumentacionInicialService } from '../../services/documentacion-inicial.service';

describe('Preparar documentos desde el expediente', () => {
  const documento = { _id: 'documento', tipoCaso: 'Alerta', numeroDeic: 'DEIC52-2026-10-18-001', casoId: 'caso', estado: 'BORRADOR', pasoActual: 3,
    caratula: { numeroMp: 'M0030-2026-100', numeroAlerta: '123-2026', nombre: 'Nombre guardado', edad: '12', lugar: 'Dirección guardada' },
    rubrica: { conoceProtocolo: 'SI' } };
  const plan = { titulo: 'Plan', elementos: [{ codigo: 'A', elemento: 'Datos generales', informacionObtenida: 'Información guardada' }], observaciones: '' };
  const rubrica = { titulo: 'Rúbrica', preguntaProtocolo: '¿Conoce el protocolo?', conoceProtocolo: 'SI', items: [{ codigo: 'B', descripcion: 'Elemento', tipo: 'ITEM', respuesta: 'SI' }] };
  let api: any;

  async function crear(tipo = 'Alerta', existente: any = null, editable = true, error = false) {
    api = {
      paraCaso: jasmine.createSpy().and.returnValue(error ? throwError(() => ({ error: { message: 'Acceso denegado' } })) : of({
        casoId: 'caso', tipoCaso: tipo, numeroDeic: documento.numeroDeic, editable, documentacion: existente,
        caratula: { numeroMp: 'M0030-2026-100', numeroAlerta: '123-2026', nombre: 'Persona del caso', edad: '', lugar: '' },
      })),
      crear: jasmine.createSpy().and.returnValue(of(documento)),
      actualizarCaratula: jasmine.createSpy().and.returnValue(of(documento)),
      obtenerPlan: jasmine.createSpy().and.returnValue(of(plan)),
      obtenerRubrica: jasmine.createSpy().and.returnValue(of(rubrica)),
      guardarPlan: jasmine.createSpy().and.returnValue(of(documento)),
      guardarRubrica: jasmine.createSpy().and.returnValue(of(documento)),
      descargarPdf: jasmine.createSpy().and.returnValue(of(new Blob(['%PDF'], { type: 'application/pdf' }))),
    };
    await TestBed.configureTestingModule({ imports: [NuevaDocumentacionComponent], providers: [
      provideRouter([]), provideNoopAnimations(),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ tipo, casoId: 'caso' }) } } },
      { provide: DocumentacionInicialService, useValue: api }, { provide: MatSnackBar, useValue: { open: jasmine.createSpy() } },
    ] }).compileComponents();
    const fixture = TestBed.createComponent(NuevaDocumentacionComponent);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    return { fixture, c: fixture.componentInstance };
  }

  for (const tipo of ['Alerta', 'Maltrato', 'Conflicto']) {
    it(`precarga ${tipo} desde el caso, fija su DEIC y ofrece regreso al expediente`, async () => {
      const { fixture, c } = await crear(tipo);
      expect(api.paraCaso).toHaveBeenCalledWith(tipo, 'caso');
      expect(c.caratulaForm.get('nombre')?.value).toBe('Persona del caso');
      expect(c.caratulaForm.get('edad')?.value).toBe('');
      expect(c.caratulaForm.get('numeroDeic')?.disabled).toBeTrue();
      expect(c.caratulaForm.get('tipoCaso')?.disabled).toBeTrue();
      expect(c.volverExpediente).toEqual(['/casos', `${tipo.toLowerCase()}-expediente`, 'caso']);
      expect(fixture.nativeElement.textContent).toContain('Imprimir no envía el expediente al analista');
      if (tipo === 'Alerta') expect(c.caratulaForm.get('numeroAlerta')?.value).toBe('123-2026');
      expect(api.crear).not.toHaveBeenCalled();
    });
  }

  it('guarda un borrador con el casoId y datos parciales, sin enviar el expediente', async () => {
    const { c } = await crear();
    c.guardarCaratula();
    expect(api.crear).toHaveBeenCalled();
    expect(api.crear.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ casoId: 'caso', numeroDeic: documento.numeroDeic }));
    expect(c.documentacionId).toBe('documento');
    expect(c.caratulaGuardada).toBeTrue();
  });
  it('recupera el mismo borrador sin duplicarlo ni reemplazar sus correcciones', async () => {
    const { c } = await crear('Alerta', documento);
    expect(c.documentacionId).toBe('documento');
    expect(c.caratulaForm.get('nombre')?.value).toBe('Nombre guardado');
    expect(c.elementosPlan[0].informacionObtenida).toBe('Información guardada');
    c.guardarCaratula();
    expect(api.actualizarCaratula).toHaveBeenCalled(); expect(api.crear).not.toHaveBeenCalled();
  });
  it('bloquea las tres escrituras mientras el caso está en revisión o aprobado', async () => {
    const { c } = await crear('Alerta', documento, false);
    expect(c.soloLectura).toBeTrue(); expect(c.caratulaForm.disabled).toBeTrue();
    c.guardarCaratula(); c.guardarPlan(); c.guardarRubrica();
    expect(api.actualizarCaratula).not.toHaveBeenCalled(); expect(api.guardarPlan).not.toHaveBeenCalled(); expect(api.guardarRubrica).not.toHaveBeenCalled();
  });
  it('guarda respuestas parciales sin inventar Sí/No para los ítems pendientes', async () => {
    const { c } = await crear('Alerta', documento);
    c.conoceProtocolo = null; c.itemsRubrica[0].respuesta = null;
    c.guardarRubrica();
    expect(api.guardarRubrica.calls.mostRecent().args[1]).toEqual({ respuestas: [] });
  });
  it('impide descargar si hay cambios de carátula sin guardar', async () => {
    const { c } = await crear('Alerta', documento);
    c.caratulaForm.get('nombre')?.setValue('Nombre corregido');
    c.descargarDocumentos(); expect(api.descargarPdf).not.toHaveBeenCalled();
  });
  it('conserva observaciones de una respuesta pendiente sin inventar Sí o No', async () => {
    const { c } = await crear('Alerta', documento);
    c.itemsRubrica[0].respuesta = null; c.itemsRubrica[0].observaciones = 'Pendiente de verificación';
    c.guardarRubrica();
    expect(api.guardarRubrica.calls.mostRecent().args[1].respuestas).toEqual([{ codigo: 'B', observaciones: 'Pendiente de verificación' }]);
  });
  it('guarda el mando y el supervisor en los campos de sus formatos originales', async () => {
    const { c } = await crear('Alerta', documento);
    c.mandoNombre = 'Mando de prueba'; c.guardarPlan();
    expect(api.guardarPlan.calls.mostRecent().args[1].mandoNombre).toBe('Mando de prueba');
    c.supervisorNombre = 'Supervisor de prueba'; c.dependenciaSupervisada = 'Sección de prueba'; c.guardarRubrica();
    expect(api.guardarRubrica.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ supervisorNombre: 'Supervisor de prueba', dependenciaSupervisada: 'Sección de prueba' }));
  });
  it('descarga el PDF guardado para imprimir y mantiene el enlace de regreso', async () => {
    const { c } = await crear('Alerta', documento);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:documentos-prueba');
    const click = spyOn(HTMLAnchorElement.prototype, 'click');
    c.descargarDocumentos();
    expect(api.descargarPdf).toHaveBeenCalledWith('documento'); expect(click).toHaveBeenCalled();
    expect(c.imprimiendo).toBeFalse(); expect(c.volverExpediente).toEqual(['/casos', 'alerta-expediente', 'caso']);
  });
  it('un error de acceso no permite crear un documento desligado del caso', async () => {
    const { fixture, c } = await crear('Alerta', null, true, true);
    expect(c.soloLectura).toBeTrue(); expect(c.errorContexto).toBeTruthy();
    expect(fixture.nativeElement.querySelector('mat-horizontal-stepper')).toBeNull();
    c.guardarCaratula(); expect(api.crear).not.toHaveBeenCalled();
  });
});
