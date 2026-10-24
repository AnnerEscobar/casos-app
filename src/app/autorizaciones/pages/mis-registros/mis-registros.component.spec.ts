import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MisRegistrosComponent } from './mis-registros.component';
import { AutorizacionesService } from '../../services/autorizaciones.service';
import { RegistroPendiente } from '../../models/registro-pendiente.model';

describe('Mis registros: casos asignados de Alerta',()=>{
  const asignado={_id:'alerta-asignada',numeroDeic:'DEIC52-2026-10-08-001',numeroMp:'M0030-2026-100',estadoRegistro:'Pendiente',tipoCaso:'Alerta',caso:{procesoAlerta:true,expedienteEnPreparacion:true}} as RegistroPendiente;
  const revision={...asignado,_id:'en-revision',caso:{procesoAlerta:true,expedienteEnPreparacion:false}};
  const rechazado={...revision,_id:'rechazado',estadoRegistro:'Rechazado'};
  const aprobado={...revision,_id:'aprobado',numeroDeic:'DEIC-APROBADO',estadoRegistro:'Aprobado',
    createdAt:'2026-01-01T08:00:00',fechaRevision:'2026-10-24T12:00:00'} as RegistroPendiente;
  let servicio: jasmine.SpyObj<AutorizacionesService>;
  beforeEach(async()=>{
    servicio=jasmine.createSpyObj<AutorizacionesService>('AutorizacionesService',['getMisRegistros']);
    servicio.getMisRegistros.and.returnValue(of([asignado,revision,rechazado]));
    await TestBed.configureTestingModule({imports:[MisRegistrosComponent],providers:[provideRouter([]),provideNoopAnimations(),
      {provide:AutorizacionesService,useValue:servicio},
      {provide:MatDialog,useValue:{open:jasmine.createSpy()}},
    ]}).compileComponents();
  });
  it('muestra Registrar caso y separa las asignaciones de las entregas en revisión',()=>{
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Registrar caso');
    expect(c.contar('Asignados')).toBe(1);expect(c.contar('Pendiente')).toBe(1);
    c.cambiarFiltro('Asignados');expect(c.registrosFiltrados.map(r=>r._id)).toEqual(['alerta-asignada']);
    c.cambiarFiltro('Pendiente');expect(c.registrosFiltrados.map(r=>r._id)).toEqual(['en-revision']);
  });
  it('abre el formulario del mismo caso asignado al pulsar Registrar caso',()=>{
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();
    const navigate=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
    const button=[...fixture.nativeElement.querySelectorAll('button')].find((b:any)=>b.textContent.includes('Registrar caso')) as HTMLButtonElement;
    button.click();expect(navigate).toHaveBeenCalledWith(['/casos/alerta-expediente','alerta-asignada']);
    expect(TestBed.inject(MatDialog).open).not.toHaveBeenCalled();
  });
  it('ofrece corregir para rechazados y consulta para expedientes en revisión',()=>{
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;
    expect(c.accionRegistro(rechazado)).toBe('Corregir caso');expect(c.accionRegistro(revision)).toBe('Ver detalle');
  });
  it('incluye maltrato en Asignados y abre su expediente',()=>{
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;
    const maltrato={...asignado,_id:'maltrato-asignado',tipoCaso:'Maltrato',caso:{procesoMaltrato:true,expedienteEnPreparacion:true}} as RegistroPendiente;
    c.registros=[...c.registros,maltrato];c.cambiarFiltro('Asignados');
    expect(c.contar('Asignados')).toBe(2);expect(c.registrosFiltrados).toContain(maltrato);
    expect(c.contar('Pendiente')).toBe(1);expect(c.accionRegistro(maltrato)).toBe('Registrar caso');
    const navigate=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);c.verDetalle(maltrato);
    expect(navigate).toHaveBeenCalledWith(['/casos/maltrato-expediente','maltrato-asignado']);
  });
  it('incluye los diez aprobados en Todos y los separa sin alterar los contadores pendientes',()=>{
    const aprobados=Array.from({length:10},(_,i)=>({...aprobado,_id:`aprobado-${i}`}));
    servicio.getMisRegistros.and.returnValue(of([asignado,revision,rechazado,...aprobados]));
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;

    expect(c.registrosFiltrados.length).toBe(13);
    expect(c.contar('Aprobado')).toBe(10);
    expect(c.contar('Asignados')).toBe(1);
    expect(c.contar('Pendiente')).toBe(1);
    expect(c.contar('Rechazado')).toBe(1);
    const button=Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b=>b.textContent?.includes('Aprobados'))!;
    expect(button.textContent?.replace(/\s+/g,' ').trim()).toBe('Aprobados 10');
    button.click();fixture.detectChanges();
    expect(c.registrosFiltrados.map(r=>r._id)).toEqual(aprobados.map(r=>r._id));
    expect(fixture.nativeElement.textContent).not.toContain('Registrar caso');
    c.cambiarFiltro('Todos');expect(c.registrosFiltrados.length).toBe(13);
  });
  it('presenta la fecha de aprobación y el estado verde al consultar aprobados',()=>{
    servicio.getMisRegistros.and.returnValue(of([aprobado]));
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;
    expect(c.fechaRegistro(aprobado)).toBe('2026-10-24T12:00:00');
    expect(c.fechaRegistro({...revision,createdAt:'2026-01-01T08:00:00'})).toBe('2026-01-01T08:00:00');
    c.cambiarFiltro('Aprobado');fixture.detectChanges();

    const host=fixture.nativeElement as HTMLElement;
    expect(host.querySelector('th.mat-column-fecha')?.textContent?.trim()).toBe('Aprobación');
    expect(host.querySelector('td.mat-column-fecha')?.textContent?.trim()).toBe('24/10/2026 12:00');
    const badge=host.querySelector('td.mat-column-estado .bg-green-50');
    expect(badge?.textContent?.trim()).toBe('Aprobado');
    expect(badge?.classList.contains('text-green-700')).toBeTrue();
    expect(host.querySelector('td.mat-column-estado .bg-red-50')).toBeNull();
    c.cambiarFiltro('Todos');fixture.detectChanges();
    expect(host.querySelector('th.mat-column-fecha')?.textContent?.trim()).toBe('Fecha');
  });
  it('muestra guion cuando falta la fecha de aprobación y no la sustituye por creación',()=>{
    const sinFecha={...aprobado,fechaRevision:undefined};
    servicio.getMisRegistros.and.returnValue(of([sinFecha]));
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;
    c.cambiarFiltro('Aprobado');fixture.detectChanges();

    expect(c.fechaRegistro(sinFecha)).toBeUndefined();
    expect(fixture.nativeElement.querySelector('td.mat-column-fecha').textContent.trim()).toBe('—');
    expect(fixture.nativeElement.querySelector('td.mat-column-fecha').textContent).not.toContain('01/01/2026');
  });
  it('ofrece Ver detalle y conserva la ruta del mismo expediente aprobado para cada tipo',()=>{
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;
    const navigate=spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
    const casos: Array<[RegistroPendiente,string]>=[
      [aprobado,'/casos/alerta-expediente'],
      [{...aprobado,_id:'maltrato-aprobado',tipoCaso:'Maltrato',caso:{procesoMaltrato:true,expedienteEnPreparacion:false}},'/casos/maltrato-expediente'],
      [{...aprobado,_id:'conflicto-aprobado',tipoCaso:'Conflicto',caso:{procesoConflicto:true,expedienteEnPreparacion:false}},'/casos/conflicto-expediente'],
    ];
    for(const [registro,ruta] of casos){
      expect(c.accionRegistro(registro)).toBe('Ver detalle');
      c.registros=[registro];c.cambiarFiltro('Aprobado');fixture.detectChanges();
      const button=Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b=>b.textContent?.includes('Ver detalle'))!;
      button.click();
      expect(navigate).toHaveBeenCalledWith([ruta,registro._id]);
    }
    expect(navigate).toHaveBeenCalledTimes(3);
    expect(TestBed.inject(MatDialog).open).not.toHaveBeenCalled();
  });
  it('mantiene el filtro Aprobados vacío con contador cero y permite volver a pendientes',()=>{
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;
    const button=Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b=>b.textContent?.includes('Aprobados'))!;
    expect(button.textContent?.replace(/\s+/g,' ').trim()).toBe('Aprobados 0');
    button.click();fixture.detectChanges();
    expect(c.registrosFiltrados).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No hay registros');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    c.cambiarFiltro('Pendiente');fixture.detectChanges();
    expect(c.registrosFiltrados.map(r=>r._id)).toEqual(['en-revision']);
    expect(c.contar('Asignados')).toBe(1);
  });
  it('actualiza el contador y conserva Aprobados seleccionado al recargar los registros',()=>{
    servicio.getMisRegistros.and.returnValue(of([asignado,revision,rechazado,aprobado]));
    const fixture=TestBed.createComponent(MisRegistrosComponent);fixture.detectChanges();const c=fixture.componentInstance;
    c.cambiarFiltro('Aprobado');fixture.detectChanges();
    const otro={...aprobado,_id:'otro-aprobado'};
    servicio.getMisRegistros.and.returnValue(of([asignado,revision,rechazado,aprobado,otro]));
    const button=Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b=>b.textContent?.includes('Actualizar'))!;
    button.click();fixture.detectChanges();

    expect(servicio.getMisRegistros).toHaveBeenCalledTimes(2);
    expect(c.filtro).toBe('Aprobado');
    expect(c.contar('Aprobado')).toBe(2);
    expect(c.registrosFiltrados.map(r=>r._id)).toEqual(['aprobado','otro-aprobado']);
    expect(c.registros.length).toBe(5);
  });
});
