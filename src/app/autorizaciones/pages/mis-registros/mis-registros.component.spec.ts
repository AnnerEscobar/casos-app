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
  beforeEach(async()=>{
    await TestBed.configureTestingModule({imports:[MisRegistrosComponent],providers:[provideRouter([]),provideNoopAnimations(),
      {provide:AutorizacionesService,useValue:{getMisRegistros:()=>of([asignado,revision,rechazado])}},
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
});
