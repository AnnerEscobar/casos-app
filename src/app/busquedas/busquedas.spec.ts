import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../auth/auth-service/auth.service';
import SearchProfileComponent from './search-profile/search-profile.component';
import ExpedientesCompartidosComponent from './expedientes-compartidos.component';
import { personaExpediente } from './persona-expediente';
import BusquedaAvanzadaComponent from './busqueda-avanzada/busqueda-avanzada.component';
import { ResultadoExpedienteComponent } from './components/resultado-expediente.component';
import { SolicitarAccesoDialogComponent } from './components/solicitar-acceso-dialog.component';
import { ExpedienteDialogComponent } from './components/expediente-dialog.component';
import { SolicitudesAccesoComponent } from './components/solicitudes-acceso.component';
const own = {
    _id: '507f1f77bcf86cd799439011', numeroDeic: 'DEIC51-2026-08-21-831', numeroMp: 'MP001-2026-2469', tipo: 'Maltrato', acceso: 'PROPIO', investigador: { _id: 'owner', nombre: 'Pedro López' }, estadoInvestigacion: 'Informado', cantidadSeguimientos: 3, ultimoMovimiento: '2026-09-10T21:03:00Z'
};
const foreign = {
    _id: '507f1f77bcf86cd799439012', numeroDeic: 'DEIC53-2018-08-21-832', tipo: 'Conflicto', acceso: 'RESTRINGIDO', investigador: { _id: 'other', nombre: 'Juan Pérez' }
};
describe('Búsquedas V3', () => {
    let role = 'Investigador';
    let http: HttpTestingController;
    let dialogData: any;
    let dialogRef: any;
    beforeEach(() => {
        history.replaceState({}, '');
        role = 'Investigador';
        dialogData = foreign;
        dialogRef = { close: jasmine.createSpy(), disableClose: false };
        TestBed.configureTestingModule({ providers: [
                { provide: MAT_DIALOG_DATA, useFactory: () => dialogData }, { provide: MatDialogRef, useFactory: () => dialogRef }, provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), provideRouter([]), { provide: AuthService, useValue: { getCurrentUser: () => ({ userId: 'owner', role }) } }
            ] });
        http = TestBed.inject(HttpTestingController);
    });
    afterEach(() => http.verify());
    describe('Cards de expedientes', () => {
        for (const tipo of ['Alerta', 'Maltrato', 'Conflicto'])
            it(tipo + ': estructura común y acción principal', () => {
                const f = TestBed.createComponent(ResultadoExpedienteComponent);
                f.componentRef.setInput('caso', { ...own, tipo });
                f.detectChanges();
                expect(f.nativeElement.textContent).toContain(own.numeroDeic);
                expect(f.nativeElement.textContent).toContain('Ver expediente');
                expect(f.nativeElement.querySelectorAll('button').length).toBe(1);
            });
        it('card restringida no muestra datos sensibles incluso si existen en memoria', () => {
            const f = TestBed.createComponent(ResultadoExpedienteComponent);
            f.componentRef.setInput('caso', {
                ...foreign, numeroMp: 'MP-SECRETO', victimas: [{ nombre: 'Nombre secreto' }], fileUrls: ['archivo-secreto'], estadoInvestigacion: 'Estado secreto', origenCaso: 'HISTORICO'
            });
            f.detectChanges();
            const t = f.nativeElement.textContent;
            expect(t).toContain('Expediente localizado');
            expect(t).toContain('Solicitar acceso');
            expect(t).not.toMatch(/SECRETO|secreto|Histórico|Ver expediente/);
        });
        it('solicitud pendiente sustituye al botón y muestra fecha', () => {
            const f = TestBed.createComponent(ResultadoExpedienteComponent);
            f.componentRef.setInput('caso', { ...foreign, solicitud: { estado: 'PENDIENTE', fechaSolicitud: '2026-09-11' } });
            f.detectChanges();
            expect(f.nativeElement.textContent).toContain('Solicitud pendiente');
            expect(f.nativeElement.textContent).toContain('Solicitud enviada');
            expect(f.nativeElement.querySelector('button')).toBeNull();
        });
        it('autorizado y seguimiento asignado usan etiquetas distintas sin reasignar el caso', () => {
            const f = TestBed.createComponent(ResultadoExpedienteComponent);
            for (const [acceso, label] of [['AUTORIZADO', 'Acceso autorizado'], ['SEGUIMIENTO_ASIGNADO', 'Seguimiento asignado']]) {
                f.componentRef.setInput('caso', { ...own, acceso });
                f.detectChanges();
                expect(f.nativeElement.textContent).toContain(label);
                expect(f.nativeElement.textContent).toContain('Pedro López');
                expect(f.nativeElement.textContent).toContain('Ver expediente');
            }
        });
        it('histórico y terminal correcto se muestran discretamente', () => {
            const f = TestBed.createComponent(ResultadoExpedienteComponent);
            f.componentRef.setInput('caso', {
                ...own, origenCaso: 'HISTORICO', estadoInvestigacion: 'Desestimado'
            });
            f.detectChanges();
            expect(f.nativeElement.textContent).toContain('Histórico');
            expect(f.nativeElement.querySelector('.terminal')).not.toBeNull();
        });
    });
    describe('Búsqueda principal', () => {
        function abrir() {
            const f = TestBed.createComponent(SearchProfileComponent);
            f.detectChanges();
            http.expectOne(r => r.url.endsWith('/solicitudes')).flush([]);
            return f;
        }
        it('MP presenta todos los resultados y evita peticiones dobles sin parpadeo', () => {
            const f = abrir();
            const c = f.componentInstance;
            c.tipoBusqueda = 'numeroMp';
            c.termino = 'MP001-2026-2469';
            c.resultadosBusqueda = [own];
            c.ejecutarBusqueda();
            c.ejecutarBusqueda();
            f.detectChanges();
            expect(c.resultadosBusqueda).toEqual([own]);
            expect(f.nativeElement.textContent).toContain('Buscando');
            http.expectOne(r => r.url.endsWith('/por-expedienteMp')).flush([own, foreign]);
            f.detectChanges();
            expect(f.nativeElement.querySelectorAll('app-resultado-expediente').length).toBe(2);
        });
        it('vacío exacto y error de red son estados distintos', () => {
            const f = abrir();
            const c = f.componentInstance;
            c.termino = 'inexistente';
            c.ejecutarBusqueda();
            http.expectOne(r => r.url.endsWith('/por-numero-deic')).flush([]);
            f.detectChanges();
            expect(f.nativeElement.textContent).toContain('No se encontró ningún expediente con ese número');
            c.ejecutarBusqueda();
            http.expectOne(r => r.url.endsWith('/por-numero-deic')).flush({}, { status: 500, statusText: 'Error' });
            f.detectChanges();
            expect(f.nativeElement.querySelector('[role=alert]').textContent).toContain('No se pudo completar');
            expect(f.nativeElement.querySelector('.empty-state')).toBeNull();
        });
        it('abre expediente mediante diálogo y nueva verificación del backend', () => {
            const f = abrir();
            const dialog = spyOn(TestBed.inject(MatDialog), 'open');
            f.componentInstance.abrir(own);
            expect(dialog).toHaveBeenCalledWith(ExpedienteDialogComponent, jasmine.objectContaining({ data: own }));
        });
    });
    describe('Filtros avanzados', () => {
        function abrir() {
            const f = TestBed.createComponent(BusquedaAvanzadaComponent);
            f.detectChanges();
            http.expectOne(r => r.url.endsWith('/solicitudes')).flush([]);
            if (role !== 'Investigador')
                http.expectOne(r => r.url.endsWith('/investigadores')).flush([{ _id: 'owner', nombre: 'Pedro López' }]);
            return f;
        }
        it('investigador no recibe controles institucionales', () => {
            const f = abrir();
            expect(f.nativeElement.querySelector('[formControlName=investigador]')).toBeNull();
            expect(f.nativeElement.querySelector('[formControlName=origenCaso]')).toBeNull();
        });
        it('analista puede filtrar investigador y origen', () => {
            role = 'Analista';
            const f = abrir();
            const c = f.componentInstance;
            expect(f.nativeElement.querySelector('[formControlName=investigador]')).not.toBeNull();
            c.filtroForm.patchValue({
                investigador: 'owner', origenCaso: 'HISTORICO', tipoCaso: 'Conflicto', estado: 'Desestimado'
            });
            c.buscarCasos();
            const req = http.expectOne(r => r.url.endsWith('/buscar'));
            expect(req.request.params.get('investigador')).toBe('owner');
            expect(req.request.params.get('origenCaso')).toBe('HISTORICO');
            expect(c.estados).not.toContain('Concluido');
            req.flush([own]);
        });
        it('valida rango antes de enviar y pagina las filas de la tabla', () => {
            const f = abrir();
            const c = f.componentInstance;
            c.filtroForm.patchValue({ fechaInicio: new Date(2026, 9, 2), fechaFin: new Date(2026, 9, 1) });
            c.buscarCasos();
            expect(c.error).toContain('fecha inicial');
            http.expectNone(r => r.url.endsWith('/buscar'));
            c.filtroForm.reset();
            c.buscarCasos();
            http.expectOne(r => r.url.endsWith('/buscar')).flush(Array.from({ length: 12 }, (_, i) => ({ ...own, _id: String(i) })));
            f.detectChanges();
            expect(f.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(10);
            c.cambiarPagina({
                pageIndex: 1, pageSize: 10, length: 12
            });
            f.detectChanges();
            expect(f.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(2);
        });
    });
    describe('Solicitud y detalle', () => {
        it('identifica desaparecido, víctimas y adolescentes sin exponer nombres restringidos', () => {
            expect(personaExpediente({ tipo: 'Alerta', nombreDesaparecido: 'Ana' }).nombre).toBe('Ana');
            expect(personaExpediente({ tipo: 'Maltrato', victimas: [{ nombre: 'Ana' }, { nombre: 'Luis' }] }).nombre).toBe('Ana, Luis');
            expect(personaExpediente({ tipo: 'Conflicto', infractores: [{ nombre: 'Luis' }], victimas: [{ nombre: 'Ana' }] }).nombre).toBe('Luis');
            expect(personaExpediente({ tipo: 'Alerta', nombreDesaparecido: 'Secreto', acceso: 'RESTRINGIDO' }).nombre).not.toContain('Secreto');
        });
        it('lista expedientes compartidos y los actualiza tras retirar un permiso', () => {
            const f = TestBed.createComponent(ExpedientesCompartidosComponent);
            f.detectChanges();
            http.expectOne(r => r.url.endsWith('/compartidos')).flush([{ ...own, acceso: 'AUTORIZADO', victimas: [{ nombre: 'Ana' }] }]);
            http.expectOne(r => r.url.endsWith('/solicitudes')).flush([]);
            f.detectChanges();
            expect(f.nativeElement.textContent).toContain('Ana');
            expect(f.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(1);
            f.componentInstance.cargar();
            http.expectOne(r => r.url.endsWith('/compartidos')).flush([]);
            f.detectChanges();
            expect(f.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(0);
        });
        it('beneficiario puede renunciar y un investigador ajeno no puede revocar', () => {
            const f = TestBed.createComponent(SolicitudesAccesoComponent);
            const s = { _id: 'permiso', estado: 'AUTORIZADA', solicitante: { _id: 'owner' }, responsable: { _id: 'other' } };
            expect(f.componentInstance.puedeRevocar(s)).toBeTrue();
            expect(f.componentInstance.puedeRevocar({ ...s, solicitante: { _id: 'tercero' } })).toBeFalse();
            f.componentInstance.revocar(s);
            f.componentInstance.revocar(s);
            http.expectOne(r => r.url.endsWith('/permiso/revocar') && r.method === 'PATCH').flush({ estado: 'REVOCADA' });
            http.expectOne(r => r.url.endsWith('/solicitudes')).flush([{ ...s, estado: 'REVOCADA' }]);
            expect(f.componentInstance.puedeRevocar({ ...s, estado: 'REVOCADA' })).toBeFalse();
        });
        it('oculta el permiso revocado incluso después de refrescar sin eliminar el historial', () => {
            const f = TestBed.createComponent(SolicitudesAccesoComponent);
            f.componentRef.setInput('expandido', true);
            f.componentRef.setInput('ocultarRevocadas', true);
            const s = { _id: 'permiso', numeroDeic: 'DEIC-REVOCADO', estado: 'AUTORIZADA', solicitante: { _id: 'owner' }, responsable: { _id: 'other' } };
            f.detectChanges();
            http.expectOne(r => r.url.endsWith('/solicitudes')).flush([s]); f.detectChanges();
            expect(f.nativeElement.textContent).toContain('DEIC-REVOCADO');
            f.componentInstance.revocar(s);
            http.expectOne(r => r.url.endsWith('/permiso/revocar') && r.method === 'PATCH').flush({ estado: 'REVOCADA' });
            f.detectChanges(); expect(f.nativeElement.textContent).not.toContain('DEIC-REVOCADO');
            http.expectOne(r => r.url.endsWith('/solicitudes')).flush([{ ...s, estado: 'REVOCADA' }]);
            f.detectChanges();
            expect(f.componentInstance.solicitudes.length).toBe(1);
            expect(f.nativeElement.textContent).not.toContain('DEIC-REVOCADO');
            expect(f.nativeElement.textContent).toContain('No hay solicitudes');
        });
        it('solicitud envía motivo sin suplantar identidad y bloquea doble envío', () => {
            const ref = dialogRef;
            const f = TestBed.createComponent(SolicitarAccesoDialogComponent);
            f.detectChanges();
            f.componentInstance.motivo.setValue('Recibí un nuevo lineamiento.');
            f.componentInstance.enviar();
            f.componentInstance.enviar();
            const req = http.expectOne(r => r.method === 'POST' && r.url.endsWith('/solicitudes'));
            expect(req.request.body).toEqual({
                tipo: 'conflicto', casoId: foreign._id, motivo: 'Recibí un nuevo lineamiento.'
            });
            req.flush({ estado: 'PENDIENTE' });
            expect(ref.close).toHaveBeenCalledWith({ estado: 'PENDIENTE' });
        });
        it('detalle denegado no usa datos sensibles de la card', () => {
            dialogData = { ...foreign, victimas: [{ nombre: 'Secreto' }] };
            const f = TestBed.createComponent(ExpedienteDialogComponent);
            f.detectChanges();
            http.expectOne(r => r.url.includes('/expediente/')).flush({}, { status: 403, statusText: 'Forbidden' });
            f.detectChanges();
            expect(f.nativeElement.textContent).toContain('Se requiere autorización');
            expect(f.nativeElement.textContent).not.toContain('Secreto');
        });
        it('expediente autorizado muestra información completa y archivos del caso, seguimiento y revisión', () => {
            dialogData = { ...own, tipo: 'Alerta' };
            const f = TestBed.createComponent(ExpedienteDialogComponent);
            f.detectChanges();
            http.expectOne(r => r.url.includes('/expediente/')).flush({
                ...own, tipo: 'Alerta', acceso: 'AUTORIZADO', nombreDesaparecido: 'Ana',
                denunciante: { nombre: 'María', cui: '123', telefono: '5555' },
                origenCaso: 'HISTORICO', observacionHistorica: 'Expediente digitalizado',
                nombreAcompanante: 'Luis', horaLocalizacion: '10:30', fechaLocalizacion: '2026-09-12',
                fileUrls: ['https://drive.google.com/uc?export=download&id=principal'],
                seguimientos: [{ fecha: '2026-09-12', estado: 'Informado', investigadorAsignadoNombre: 'Pedro', archivos: ['https://drive.google.com/uc?id=seguimiento'] }],
                historialRevisiones: [{ tipo: 'APROBADO', observacion: 'Documentación revisada', archivoUrl: 'https://drive.google.com/uc?id=revision' }],
            });
            f.detectChanges();
            const contenido = f.nativeElement.textContent;
            for (const texto of ['Ana', 'María', '5555', 'Luis', '10:30', 'Expediente digitalizado', 'Pedro', 'Documentación revisada']) expect(contenido).toContain(texto);
            const enlaces = [...f.nativeElement.querySelectorAll('a')].map((a: any) => a.getAttribute('href'));
            for (const id of ['principal', 'seguimiento', 'revision']) expect(enlaces).toContain(`https://drive.google.com/file/d/${id}/view`);
            expect(f.componentInstance.puedeSeguimiento).toBeFalse();
        });
        it('bandeja no permite resolver solicitud propia y actualiza al autorizar', () => {
            const f = TestBed.createComponent(SolicitudesAccesoComponent);
            f.detectChanges();
            const solicitud = {
                _id: 's', solicitante: { _id: 'other', nombre: 'Juan' }, responsable: { _id: 'owner' }, estado: 'PENDIENTE'
            };
            http.expectOne(r => r.url.endsWith('/solicitudes')).flush([solicitud]);
            expect(f.componentInstance.puedeResolver({ ...solicitud, solicitante: { _id: 'owner' } })).toBeFalse();
            f.componentInstance.resolver(solicitud, 'AUTORIZADA');
            http.expectOne(r => r.method === 'PATCH').flush({ estado: 'AUTORIZADA' });
            http.expectOne(r => r.method === 'GET').flush([{ ...solicitud, estado: 'AUTORIZADA' }]);
            expect(f.componentInstance.pendientes).toBe(0);
        });
    });
});
