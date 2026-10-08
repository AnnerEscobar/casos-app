import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BandejaAccesosService } from './bandeja-accesos.service';
import { BusquedaService } from './search-profile/busqueda.service';

describe('Bandeja de accesos compartida', () => {
  it('comparte la consulta, se actualiza tras resolver y detiene el sondeo al salir', fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController), bandeja = TestBed.inject(BandejaAccesosService), api = TestBed.inject(BusquedaService);
    let pendientes = 0;
    const a = bandeja.estado$.subscribe(s => pendientes = s.solicitudes.filter(x => x.puedeResolver).length);
    const b = bandeja.estado$.subscribe();
    tick(0);
    http.expectOne(r => r.url.endsWith('/bandeja-accesos')).flush([{ puedeResolver: true }]);
    expect(pendientes).toBe(1);
    api.resolver('solicitud', 'AUTORIZADA').subscribe();
    http.expectOne(r => r.method === 'PATCH').flush({});
    http.expectOne(r => r.url.endsWith('/bandeja-accesos')).flush([{ puedeResolver: false }]);
    expect(pendientes).toBe(0);
    tick(60000);
    http.expectOne(r => r.url.endsWith('/bandeja-accesos')).flush([]);
    a.unsubscribe(); b.unsubscribe(); tick(60000);
    http.expectNone(r => r.url.endsWith('/bandeja-accesos')); http.verify();
  }));
  it('permite reintentar después de un error de red', fakeAsync(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController), bandeja = TestBed.inject(BandejaAccesosService);
    let error = false;
    const sub = bandeja.estado$.subscribe(s => error = s.error);
    tick(0); http.expectOne(r => r.url.endsWith('/bandeja-accesos')).flush({}, { status: 500, statusText: 'Error' });
    expect(error).toBeTrue(); bandeja.actualizar();
    http.expectOne(r => r.url.endsWith('/bandeja-accesos')).flush([]); expect(error).toBeFalse();
    sub.unsubscribe(); http.verify();
  }));
});
