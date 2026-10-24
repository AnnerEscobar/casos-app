import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import AlertaGestionComponent from './alerta-gestion.component';
import { AlertaGestionService } from './alerta-gestion.service';
import { AuthService } from '../../auth/auth-service/auth.service';
import { UsuariosService } from '../../usuarios/services/usuarios.service';

describe('Flujo de Alerta por roles',()=>{
  const inicial={numeroDeic:'DEIC52-2026-10-08-001',nombreDesaparecido:'Persona de prueba',fechaIngreso:'2026-10-08',investigadorAsignado:'investigador'};
  async function crear(analista:boolean,id:string|null=null,caso:any={}){
    const api={listar:jasmine.createSpy().and.returnValue(of([])),detalle:jasmine.createSpy().and.returnValue(of(caso)),registrar:jasmine.createSpy().and.returnValue(of({...inicial,_id:'id'})),guardar:jasmine.createSpy().and.returnValue(of(caso)),entregar:jasmine.createSpy().and.returnValue(of({...caso,expedienteEnPreparacion:false,estadoRegistro:'Pendiente'}))};
    await TestBed.configureTestingModule({imports:[AlertaGestionComponent],providers:[provideRouter([]),provideNoopAnimations(),
      {provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=>id}}}},
      {provide:AuthService,useValue:{hasRole:()=>analista,getCurrentUser:()=>null}},
      {provide:UsuariosService,useValue:{getInvestigadores:()=>of([{_id:'investigador',nombre:'Investigador activo',activo:true},{_id:'inactivo',nombre:'Inactivo',activo:false}])}},
      {provide:AlertaGestionService,useValue:api},{provide:MatSnackBar,useValue:{open:()=>{}}},
    ]}).compileComponents();
    const fixture=TestBed.createComponent(AlertaGestionComponent);fixture.detectChanges();
    return {fixture,c:fixture.componentInstance,api};
  }
  it('el analista abre sin archivo y selecciona solo investigadores activos',async()=>{
    const {fixture,c,api}=await crear(true);
    expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
    expect(c.investigadores.length).toBe(1);
    c.form.patchValue(inicial);c.guardar();
    expect(api.registrar).toHaveBeenCalled();
    expect(api.registrar.calls.mostRecent().args[0].investigadorAsignado).toBe('investigador');
    expect(api.registrar.calls.mostRecent().args[0].file).toBeUndefined();
    expect(api.entregar).not.toHaveBeenCalled();
  });
  it('ofrece catálogos y limpia el municipio al cambiar departamento',async()=>{
    const {fixture,c}=await crear(true);
    expect(c.form.get('fichaAlerta.delegacion')?.value).toBe('DEPARTAMENTO DE NIÑEZ Y ADOLESCENCIA');
    expect(c.opciones('casaHogar')).toContain('Diamante I');
    expect(c.opciones('origenAlerta')).toContain('Casa hogar');
    c.form.get('direccion.departamento')?.setValue('Guatemala');
    expect(c.opciones('municipio','direccion')).toContain('GUATEMALA');
    c.form.get('direccion.municipio')?.setValue('Guatemala');
    c.cambiarDepartamento('direccion');
    expect(c.form.get('direccion.municipio')?.value).toBeNull();
    expect(fixture.nativeElement.querySelector('input[formControlName="departamento"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('mat-select').length).toBeGreaterThan(5);
  });
  it('conserva los datos cuando la apertura falla',async()=>{
    const {c,api}=await crear(true);c.form.patchValue(inicial);
    api.registrar.and.returnValue(throwError(()=>({error:{message:'DEIC duplicado'}})));c.guardar();
    expect(c.error).toBe('DEIC duplicado');expect(c.form.get('numeroDeic')?.value).toBe(inicial.numeroDeic);expect(c.ocupado).toBeFalse();
  });
  it('el investigador solo ve su listado al entrar al registro inicial',async()=>{
    const {fixture,c}=await crear(false);expect(c.editable).toBeFalse();expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it('permite completar una asignación y conserva ceros sin inventar fechas',async()=>{
    const {c}=await crear(false,'id',{...inicial,numeroMp:'M0030-2026-100',numeroAlerta:'123-2026',direccion:{departamento:'Guatemala',municipio:'Guatemala',direccionDetallada:'Dirección inicial'},fichaAlerta:{resenaDesaparicion:'Reseña del requerimiento'},procesoAlerta:true,expedienteEnPreparacion:true,estadoRegistro:'Pendiente'});
    expect(c.editable).toBeTrue();expect(c.form.get('numeroDeic')?.disabled).toBeTrue();
    expect(c.form.get('nombreDesaparecido')?.value).toBe(inicial.nombreDesaparecido);
    expect(c.form.get('numeroMp')?.value).toBe('M0030-2026-100');
    expect(c.form.get('direccion.direccionDetallada')?.value).toBe('Dirección inicial');
    expect(c.form.get('fichaAlerta.resenaDesaparicion')?.value).toBe('Reseña del requerimiento');
    c.form.get('fichaAlerta.entrevistas')?.setValue(0);
    const datos=c.payload();expect(datos.fichaAlerta.entrevistas).toBe(0);expect(datos.fecha_Nac).toBeNull();expect(datos.investigadorAsignado).toBeUndefined();
  });
  it('exige nacimiento y estado al investigador antes de guardar y enviar',async()=>{
    const {c,api}=await crear(false,'id',{...inicial,procesoAlerta:true,expedienteEnPreparacion:true,estadoRegistro:'Pendiente'});
    c.file=new File(['%PDF-1.7'],'expediente.pdf',{type:'application/pdf'});
    c.guardar(true);
    expect(c.error).toContain('fecha de nacimiento');expect(c.error).toContain('estado de investigación');
    expect(api.guardar).not.toHaveBeenCalled();expect(api.entregar).not.toHaveBeenCalled();
  });
  it('guarda antes de entregar y bloquea la edición después del envío',async()=>{
    const {c,api}=await crear(false,'id',{...inicial,procesoAlerta:true,expedienteEnPreparacion:true,estadoRegistro:'Pendiente'});
    c.form.patchValue({numeroMp:'M0030-2026-100',numeroAlerta:'123-2026',fecha_Nac:'2014-01-01',estadoInvestigacion:'Informado',direccion:{departamento:'Guatemala',municipio:'Guatemala',direccionDetallada:'Dirección conocida'}});
    c.file=new File(['%PDF-1.7'],'expediente.pdf',{type:'application/pdf'});c.guardar(true);
    expect(api.guardar).toHaveBeenCalledBefore(api.entregar);expect(c.editable).toBeFalse();expect(c.form.disabled).toBeTrue();
  });
  it('si falla la subida conserva archivo y datos para reintentar',async()=>{
    const {c,api}=await crear(false,'id',{...inicial,procesoAlerta:true,expedienteEnPreparacion:true,estadoRegistro:'Pendiente'});
    api.entregar.and.returnValue(throwError(()=>({error:{message:'No se pudo subir el PDF'}})));
    c.form.patchValue({numeroMp:'M0030-2026-100',numeroAlerta:'123-2026',fecha_Nac:'2014-01-01',estadoInvestigacion:'Informado',direccion:{departamento:'Guatemala',municipio:'Guatemala',direccionDetallada:'Dirección conocida'}});
    c.file=new File(['%PDF-1.7'],'expediente.pdf',{type:'application/pdf'});c.guardar(true);
    expect(c.file).not.toBeNull();expect(c.editable).toBeTrue();expect(c.error).toContain('PDF');
  });
  it('un rechazo permite corregir datos y volver a entregar',async()=>{
    const {fixture,c}=await crear(false,'id',{...inicial,procesoAlerta:true,expedienteEnPreparacion:false,estadoRegistro:'Rechazado',motivoRechazo:'Corregir reseña'});
    expect(c.editable).toBeTrue();expect(fixture.nativeElement.textContent).toContain('Corregir reseña');
  });
  it('no habilita la edición cuando el expediente está en revisión o aprobado',async()=>{
    const {c}=await crear(false,'id',{...inicial,procesoAlerta:true,expedienteEnPreparacion:false,estadoRegistro:'Pendiente'});
    expect(c.editable).toBeFalse();expect(c.form.disabled).toBeTrue();
  });
  it('no permite cantidades fraccionarias o negativas',async()=>{
    const {c}=await crear(true);c.form.patchValue(inicial);
    c.form.get('fichaAlerta.entrevistas')?.setValue(-1);expect(c.form.invalid).toBeTrue();
    c.form.get('fichaAlerta.entrevistas')?.setValue(1.5);expect(c.form.invalid).toBeTrue();
  });
});
