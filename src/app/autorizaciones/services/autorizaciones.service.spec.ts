import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environment.prod';
import { RegistroPendiente, TipoCaso } from '../models/registro-pendiente.model';
import { AutorizacionesService } from './autorizaciones.service';

describe('AutorizacionesService: registros propios y aprobaciones recientes', () => {
  const tipos: Array<{ endpoint: string; tipo: TipoCaso }> = [
    { endpoint: 'maltratos', tipo: 'Maltrato' },
    { endpoint: 'alertas', tipo: 'Alerta' },
    { endpoint: 'conflictos', tipo: 'Conflicto' },
  ];
  let servicio: AutorizacionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AutorizacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function responder(datos: Record<string, any[]>, accion = 'mis-registros'): void {
    for (const { endpoint } of tipos) {
      const peticion = http.expectOne(`${environment.apiUrl}/${endpoint}/${accion}`);
      expect(peticion.request.method).toBe('GET');
      peticion.flush(datos[endpoint] ?? []);
    }
  }

  it('combina treinta aprobados y conserva solo los diez más recientemente aprobados de todos los tipos', () => {
    const datos: Record<string, any[]> = {};
    const porRecencia: Array<{ id: string; orden: number }> = [];
    for (let tipo = 0; tipo < tipos.length; tipo++) {
      const { endpoint } = tipos[tipo];
      datos[endpoint] = Array.from({ length: 10 }, (_, i) => {
        const orden = i * 3 + tipo + 1;
        const caso = {
          _id: `${endpoint}-${orden}`,
          numeroDeic: `DEIC-${orden}`,
          numeroMp: `MP-${orden}`,
          estadoRegistro: 'Aprobado',
          fechaRevision: `2026-10-${String(orden).padStart(2, '0')}T12:00:00.000Z`,
          // Creación inversa y actualización posterior no deben convertir una aprobación vieja en reciente.
          createdAt: `2026-10-${String(31 - orden).padStart(2, '0')}T12:00:00.000Z`,
          updatedAt: orden === 1 ? '2030-01-01T00:00:00.000Z' : '2026-10-01T00:00:00.000Z',
        };
        porRecencia.push({ id: caso._id, orden });
        return caso;
      });
    }
    let resultado: RegistroPendiente[] = [];
    servicio.getMisRegistros().subscribe(registros => resultado = registros);
    responder(datos);

    const esperados = porRecencia.sort((a, b) => b.orden - a.orden).slice(0, 10).map(c => c.id);
    expect(resultado.map(c => c._id)).toEqual(esperados);
    expect(resultado.length).toBe(10);
    expect(new Set(resultado.map(c => c.tipoCaso)).size).toBe(3);
    for (const registro of resultado) {
      expect(registro.fechaRevision).toBe(registro.caso.fechaRevision);
      expect(registro.numeroDeic).toBe(registro.caso.numeroDeic);
      expect(registro.numeroMp).toBe(registro.caso.numeroMp);
    }
    expect(resultado.some(c => c._id === 'maltratos-1')).toBeFalse();
  });

  it('desempata aprobaciones por creación e identificador y deja las fechas de aprobación ausentes al final', () => {
    const fechaRevision = '2026-10-24T10:00:00.000Z';
    const caso = (id: string, createdAt: string, revision: string | undefined = fechaRevision) => ({
      _id: id, estadoRegistro: 'Aprobado', fechaRevision: revision, createdAt,
    });
    let resultado: RegistroPendiente[] = [];
    servicio.getMisRegistros().subscribe(registros => resultado = registros);
    responder({
      maltratos: [caso('000000000000000000000001', '2026-01-01T00:00:00.000Z')],
      alertas: [
        caso('000000000000000000000002', '2026-02-01T00:00:00.000Z'),
        { ...caso('sin-fecha', '2030-01-01T00:00:00.000Z'), fechaRevision: undefined, updatedAt: '2031-01-01T00:00:00.000Z' },
      ],
      conflictos: [
        caso('000000000000000000000003', '2026-02-01T00:00:00.000Z'),
        caso('aprobacion-anterior', '2029-01-01T00:00:00.000Z', '2026-10-23T10:00:00.000Z'),
      ],
    });

    expect(resultado.map(c => c._id)).toEqual([
      '000000000000000000000003', '000000000000000000000002',
      '000000000000000000000001', 'aprobacion-anterior', 'sin-fecha',
    ]);
    expect(resultado.at(-1)?.fechaRevision).toBeUndefined();
  });

  it('preserva todos los asignados, pendientes y rechazados aunque excedan diez registros', () => {
    const datos: Record<string, any[]> = {};
    const idsNoAprobados: string[] = [];
    for (const { endpoint } of tipos) {
      datos[endpoint] = [];
      for (const estado of ['asignado', 'revision', 'rechazado']) {
        for (let i = 0; i < 4; i++) {
          const _id = `${endpoint}-${estado}-${i}`;
          idsNoAprobados.push(_id);
          datos[endpoint].push({
            _id,
            estadoRegistro: estado === 'rechazado' ? 'Rechazado' : 'Pendiente',
            expedienteEnPreparacion: estado === 'asignado',
            createdAt: '2026-01-01T00:00:00.000Z',
          });
        }
      }
      datos[endpoint].push(...Array.from({ length: 10 }, (_, i) => ({
        _id: `${endpoint}-aprobado-${i}`,
        estadoRegistro: 'Aprobado',
        fechaRevision: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
        createdAt: '2026-01-01T00:00:00.000Z',
      })));
    }
    let resultado: RegistroPendiente[] = [];
    servicio.getMisRegistros().subscribe(registros => resultado = registros);
    responder(datos);

    const pendientes = resultado.filter(c => c.estadoRegistro !== 'Aprobado');
    expect(resultado.length).toBe(46);
    expect(pendientes.length).toBe(36);
    expect(pendientes.map(c => c._id).sort()).toEqual(idsNoAprobados.sort());
    expect(pendientes.filter(c => c.caso.expedienteEnPreparacion).length).toBe(12);
    expect(pendientes.filter(c => c.estadoRegistro === 'Pendiente' && !c.caso.expedienteEnPreparacion).length).toBe(12);
    expect(pendientes.filter(c => c.estadoRegistro === 'Rechazado').length).toBe(12);
    expect(resultado.filter(c => c.estadoRegistro === 'Aprobado').length).toBe(10);
  });

  it('devuelve una lista vacía cuando ninguno de los tres tipos tiene registros', () => {
    let resultado: RegistroPendiente[] | undefined;
    servicio.getMisRegistros().subscribe(registros => resultado = registros);
    responder({});
    expect(resultado).toEqual([]);
  });

  it('propaga el error de un tipo en lugar de mostrar una lista parcial como completa', () => {
    const siguiente = jasmine.createSpy('siguiente');
    const error = jasmine.createSpy('error');
    servicio.getMisRegistros().subscribe({ next: siguiente, error });
    const peticiones = tipos.map(({ endpoint }) => http.expectOne(`${environment.apiUrl}/${endpoint}/mis-registros`));
    peticiones[0].flush([]);
    peticiones[1].flush([], { status: 500, statusText: 'Error de prueba' });
    expect(siguiente).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(peticiones[2].cancelled).toBeTrue();
  });

  it('mantiene sin límite la bandeja del analista y ordena sus pendientes por creación', () => {
    const datos: Record<string, any[]> = {};
    for (const { endpoint } of tipos) {
      datos[endpoint] = Array.from({ length: 13 }, (_, i) => ({
        _id: `${endpoint}-${i}`,
        estadoRegistro: 'Pendiente',
        createdAt: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
      }));
    }
    let resultado: RegistroPendiente[] = [];
    servicio.getPendientes().subscribe(registros => resultado = registros);
    responder(datos, 'pendientes-autorizacion');

    expect(resultado.length).toBe(39);
    expect(resultado[0].createdAt).toBe('2026-10-13T00:00:00.000Z');
    expect(resultado.at(-1)?.createdAt).toBe('2026-10-01T00:00:00.000Z');
    expect(new Set(resultado.map(c => c.tipoCaso)).size).toBe(3);
  });
});
