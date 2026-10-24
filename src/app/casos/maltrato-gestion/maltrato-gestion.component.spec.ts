import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import MaltratoGestionComponent from './maltrato-gestion.component';
import { MaltratoGestionService } from './maltrato-gestion.service';
import { AuthService } from '../../auth/auth-service/auth.service';
import { UsuariosService } from '../../usuarios/services/usuarios.service';

describe('Formulario de maltrato por rol',()=>{
  const inicial={numeroDeic:'DEIC51-2026-10-09-001',fechaIngreso:'2026-10-09',investigadorAsignado:'investigador'};
  const caso={...inicial,victimas:[{nombre:'Víctima de prueba',edadReportada:12,denuncianteNombre:'Denunciante inicial'}],infractores:[{nombre:'Sindicado de prueba'}],numeroMp:'M0030-2026-100',estadoInvestigacion:'Informado',lugarHechos:{departamento:'Guatemala',municipio:'Guatemala',direccionDetallada:'Dirección conocida'},fichaMaltrato:{resenaHecho:'Reseña del analista',entrevistas:0},procesoMaltrato:true,expedienteEnPreparacion:true,estadoRegistro:'Pendiente'};
  async function crear(analista:boolean,id:string|null=null,datos:any=caso){
    const api={listar:jasmine.createSpy().and.returnValue(of([])),detalle:jasmine.createSpy().and.returnValue(of(datos)),registrar:jasmine.createSpy().and.returnValue(of({...inicial,_id:'id'})),guardar:jasmine.createSpy().and.returnValue(of(datos)),entregar:jasmine.createSpy().and.returnValue(of({...datos,expedienteEnPreparacion:false,estadoRegistro:'Pendiente'}))};
    await TestBed.configureTestingModule({imports:[MaltratoGestionComponent],providers:[provideRouter([]),provideNoopAnimations(),
      {provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=>id}}}},
      {provide:AuthService,useValue:{hasRole:()=>analista,getCurrentUser:()=>null}},
      {provide:UsuariosService,useValue:{getInvestigadores:()=>of([{_id:'investigador',nombre:'Activo',activo:true},{_id:'inactivo',nombre:'Inactivo',activo:false}])}},
      {provide:MaltratoGestionService,useValue:api},{provide:MatSnackBar,useValue:{open:()=>{}}},
    ]}).compileComponents();
    const fixture=TestBed.createComponent(MaltratoGestionComponent);fixture.detectChanges();return {fixture,c:fixture.componentInstance,api};
  }
  it('el analista registra datos mínimos sin archivo ni sindicado obligatorio',async()=>{
    const {fixture,c,api}=await crear(true);c.form.patchValue(inicial);c.personas('victimas').at(0).patchValue({nombre:'Víctima inicial'});
    expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();expect(c.investigadores.length).toBe(1);
    c.guardar();expect(api.registrar).toHaveBeenCalled();const datos=api.registrar.calls.mostRecent().args[0];
    expect(Array.isArray(datos.victimas)).toBeTrue();expect(datos.victimas[0].nombre).toBe('Víctima inicial');expect(datos.victimas[0].edadReportada).toBeNull();expect(datos.sindicados).toEqual([]);
    expect(api.entregar).not.toHaveBeenCalled();
  });
  it('mantiene datos al fallar el registro y no deja quitar la última víctima',async()=>{
    const {c,api}=await crear(true);c.form.patchValue(inicial);c.personas('victimas').at(0).patchValue({nombre:'Inicial'});
    api.registrar.and.returnValue(throwError(()=>({error:{message:'DEIC duplicado'}})));c.guardar();
    expect(c.error).toBe('DEIC duplicado');expect(c.personas('victimas').at(0).get('nombre')?.value).toBe('Inicial');
    c.retirarPersona('victimas',0);expect(c.personas('victimas').length).toBe(1);
  });
  it('el investigador carga víctimas, sindicados y datos del mismo caso',async()=>{
    const {c}=await crear(false,'id');
    expect(c.form.get('numeroDeic')?.disabled).toBeTrue();expect(c.personas('victimas').at(0).get('denuncianteNombre')?.value).toBe('Denunciante inicial');
    expect(c.personas('sindicados').at(0).get('nombre')?.value).toBe('Sindicado de prueba');expect(c.form.get('fichaMaltrato.resenaHecho')?.value).toBe('Reseña del analista');
    const datos=c.payload();expect(datos.fichaMaltrato.entrevistas).toBe(0);expect(datos.investigadorAsignado).toBeUndefined();expect(Array.isArray(datos.sindicados)).toBeTrue();
  });
  it('permite varias víctimas con denunciantes distintos y departamentos dependientes',async()=>{
    const {c}=await crear(true);c.agregarPersona('victimas',{nombre:'Segunda',denuncianteNombre:'Otro denunciante'});
    const p=c.personas('victimas').at(1);p.get('departamento')?.setValue('Guatemala');
    expect(c.opciones('municipio',p)).toContain('GUATEMALA');p.get('municipio')?.setValue('Guatemala');c.cambiarDepartamento(p);expect(p.get('municipio')?.value).toBeNull();
    expect(c.payload().victimas[1].denuncianteNombre).toBe('Otro denunciante');
  });
  it('guarda avances sin edad y bloquea la entrega hasta completar cada víctima',async()=>{
    const {c,api}=await crear(false,'id',{...caso,victimas:[{nombre:'Sin edad'}]});c.guardar();expect(api.guardar).toHaveBeenCalled();api.guardar.calls.reset();
    c.file=new File(['%PDF-1.7'],'expediente.pdf',{type:'application/pdf'});c.guardar(true);
    expect(c.error).toContain('edad conocida');expect(api.guardar).not.toHaveBeenCalled();expect(api.entregar).not.toHaveBeenCalled();
  });
  it('guarda antes de entregar y bloquea la edición al enviar',async()=>{
    const {c,api}=await crear(false,'id');c.file=new File(['%PDF-1.7'],'expediente.pdf',{type:'application/pdf'});c.guardar(true);
    expect(api.guardar).toHaveBeenCalledBefore(api.entregar);expect(api.guardar.calls.mostRecent().args[0]).toBe('id');expect(c.editable).toBeFalse();expect(c.form.disabled).toBeTrue();
  });
  it('conserva el archivo si falla el envío y permite corregir rechazados',async()=>{
    const {c,api}=await crear(false,'id',{...caso,expedienteEnPreparacion:false,estadoRegistro:'Rechazado'});
    api.entregar.and.returnValue(throwError(()=>({error:{message:'Error al subir'}})));const file=new File(['%PDF-1.7'],'expediente.pdf',{type:'application/pdf'});c.file=file;c.guardar(true);
    expect(c.editable).toBeTrue();expect(c.file).toBe(file);expect(c.error).toBe('Error al subir');
  });
  it('el analista consulta sin modificar el expediente',async()=>{
    const {c,api}=await crear(true,'id');expect(c.form.disabled).toBeTrue();c.guardar();expect(api.guardar).not.toHaveBeenCalled();
  });
  it('el investigador entra al listado y no crea casos desde el registro inicial',async()=>{
    const {c,fixture}=await crear(false);expect(c.editable).toBeFalse();expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
