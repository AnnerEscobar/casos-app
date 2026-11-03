import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CargaMasivaDialogComponent } from './carga-masiva.component';

describe('Carga masiva',()=>{
  let fixture:ComponentFixture<CargaMasivaDialogComponent>,component:CargaMasivaDialogComponent,http:HttpTestingController;
  const ref={disableClose:false,close:jasmine.createSpy('close')};
  beforeEach(async()=>{
    await TestBed.configureTestingModule({imports:[CargaMasivaDialogComponent],providers:[provideHttpClient(),provideHttpClientTesting(),provideNoopAnimations(),{provide:MAT_DIALOG_DATA,useValue:'maltrato'},{provide:MatDialogRef,useValue:ref}]}).compileComponents();
    fixture=TestBed.createComponent(CargaMasivaDialogComponent);component=fixture.componentInstance;http=TestBed.inject(HttpTestingController);fixture.detectChanges();
  });
  afterEach(()=>http.verify());
  const respuesta={hojas:['MALTRATO 2026'],hoja:'MALTRATO 2026',huella:'a'.repeat(64),casos:[{numeroDeic:'DEIC51-2026-01-01-1',filas:[2,3],estado:'listo',errores:[],victimas:2,infractores:0,nombre:'PERSONA A / PERSONA B',investigador:''}],resumen:{filas:2,casos:1,listos:1,importados:0,existentes:0,errores:0}};
  it('muestra agrupación y exige revisión y confirmación antes de importar',()=>{
    expect(fixture.nativeElement.textContent).toContain('Una fila por víctima');
    component.archivo=new File(['datos'],'base.csv');component.hoja='MALTRATO 2026';component.solicitar(true);http.expectNone(r=>r.url.includes('carga-masiva'));
    component.solicitar(false);expect(ref.disableClose).toBeTrue();
    const req=http.expectOne(r=>r.url.endsWith('/maltratos/carga-masiva'));expect(req.request.body.get('accion')).toBe('vista-previa');req.flush(respuesta);fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2 filas · 1 casos agrupados');expect(component.confirmado).toBeFalse();
    component.confirmado=true;component.solicitar(true);
    const guardar=http.expectOne(r=>r.url.endsWith('/maltratos/carga-masiva'));expect(guardar.request.body.get('huella')).toBe(respuesta.huella);expect(guardar.request.body.get('accion')).toBe('importar');
    guardar.flush({...respuesta,resumen:{...respuesta.resumen,listos:0,importados:1}});expect(component.terminado).toBeTrue();expect(ref.disableClose).toBeFalse();
  });
  it('invalida la confirmación al cambiar opciones y ante una respuesta incierta',()=>{
    component.archivo=new File(['datos'],'base.csv');component.hoja='MALTRATO 2026';component.vista=respuesta;component.confirmado=true;component.invalidar();expect(component.vista).toBeNull();expect(component.confirmado).toBeFalse();
    component.vista=respuesta;component.confirmado=true;component.solicitar(true);
    http.expectOne(r=>r.url.endsWith('/maltratos/carga-masiva')).error(new ProgressEvent('error'));
    expect(component.vista).toBeNull();expect(component.error).toContain('algunos casos pudieron haberse guardado');expect(component.confirmado).toBeFalse();
  });
  it('descarta el archivo anterior si el nuevo es incompatible',()=>{
    component.vista=respuesta;component.confirmado=true;
    const input=document.createElement('input');Object.defineProperty(input,'files',{value:[new File(['x'],'invalido.xls')]});
    component.seleccionar({target:input} as unknown as Event);
    expect(component.archivo).toBeNull();expect(component.vista).toBeNull();expect(component.error).toContain('hasta 5 MB');
  });
});
