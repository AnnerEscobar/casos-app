import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DocumentacionInicialService } from './documentacion-inicial.service';

describe('DocumentacionInicialService', () => {
  let service: DocumentacionInicialService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DocumentacionInicialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('consulta el contexto del caso sin crear un borrador al abrirlo', () => {
    service.paraCaso('Alerta', 'caso').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/documentacion-inicial/para-caso/Alerta/caso'));
    expect(req.request.method).toBe('GET');
    expect(req.request.body).toBeNull();
    req.flush({ editable: true, documentacion: null });
  });

  it('descarga el PDF autenticado como archivo binario', () => {
    service.descargarPdf('documento').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/documentacion-inicial/documento/pdf'));
    expect(req.request.responseType).toBe('blob');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(new Blob(['%PDF'], { type: 'application/pdf' }));
  });
});
