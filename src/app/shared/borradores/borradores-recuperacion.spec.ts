import { Component } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../auth/auth-service/auth.service';
import { BorradorFormularioDirective } from './borrador-formulario.directive';
import { BorradoresService } from './borradores.service';

@Component({
  imports: [ReactiveFormsModule, BorradorFormularioDirective],
  template: `<form appBorrador="registro-qa" [formGroup]="form"><input formControlName="nombre"><button type="submit">Guardar</button></form>`,
})
class RegistroQa {
  form = new FormGroup({
    nombre: new FormControl('', Validators.required),
    numeroDeic: new FormControl({ value: 'VALOR DEL SERVIDOR', disabled: true }),
  });
}

describe('Recuperación de registros y aislamiento de borradores', () => {
  let usuario: string, storage: BorradoresService;
  const limpiar = () => {
    for (const k of Object.keys(localStorage)) if (k.startsWith('sgic:borrador:v1:qa-borradores-')) localStorage.removeItem(k);
  };
  beforeEach(() => {
    limpiar(); usuario = 'qa-borradores-1';
    TestBed.configureTestingModule({ imports: [RegistroQa], providers: [provideRouter([]),
      { provide: AuthService, useValue: { getCurrentUser: () => ({ userId: usuario }) } },
    ] });
    storage = TestBed.inject(BorradoresService);
  });
  afterEach(limpiar);
  const crear = () => { const f = TestBed.createComponent(RegistroQa); f.detectChanges(); flushMicrotasks(); return f; };
  const clave = () => storage.clave(usuario, TestBed.inject(Router).url + ':registro-qa');

  it('recupera lo escrito al volver a abrir el registro con la misma identidad', fakeAsync(() => {
    let f = crear(); f.componentInstance.form.markAsDirty();
    f.componentInstance.form.controls.nombre.setValue('Persona ficticia QA'); f.destroy();
    f = crear();
    expect(f.componentInstance.form.controls.nombre.value).toBe('Persona ficticia QA');
    expect(f.nativeElement.textContent).toContain('Borrador local recuperado');
    f.destroy();
  }));
  it('no carga un borrador de otra cuenta ni de otra pantalla', fakeAsync(() => {
    storage.guardar(storage.clave('qa-borradores-2', TestBed.inject(Router).url + ':registro-qa'), { nombre: 'Otra cuenta' });
    storage.guardar(storage.clave(usuario, '/otra-pantalla:registro-qa'), { nombre: 'Otra pantalla' });
    const f = crear(); expect(f.componentInstance.form.controls.nombre.value).toBe(''); f.destroy();
  }));
  it('no reemplaza campos que el servidor ha bloqueado', fakeAsync(() => {
    storage.guardar(clave(), { nombre: 'Avance local', numeroDeic: 'VALOR LOCAL ANTIGUO' });
    const f = crear();
    expect(f.componentInstance.form.controls.nombre.value).toBe('Avance local');
    expect(f.componentInstance.form.controls.numeroDeic.value).toBe('VALOR DEL SERVIDOR'); f.destroy();
  }));
  it('el reset de un envío confirmado limpia submitted y borrador, conservando required', fakeAsync(() => {
    const f = crear(), form = f.componentInstance.form;
    form.markAsDirty(); form.controls.nombre.setValue('Registro confirmado QA');
    f.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    const grupo = f.debugElement.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective);
    expect(grupo.submitted).toBeTrue();
    form.reset(); flushMicrotasks();
    expect(grupo.submitted).toBeFalse(); expect(form.untouched).toBeTrue();
    expect(form.controls.nombre.hasError('required')).toBeTrue();
    expect(storage.leer(clave())).toBeNull(); f.destroy();
  }));
  it('un error de envío conserva el avance para reintentar', fakeAsync(() => {
    const f = crear(); const form = f.componentInstance.form;
    form.markAsDirty(); form.controls.nombre.setValue('Avance sin confirmar');
    form.setErrors({ servidor: true }); f.destroy();
    const nueva = crear(); expect(nueva.componentInstance.form.controls.nombre.value).toBe('Avance sin confirmar'); nueva.destroy();
  }));
  it('restaura fechas y omite archivos y credenciales de la copia local', () => {
    const k = storage.clave(usuario, '/datos-qa');
    storage.guardar(k, { fecha: new Date('2014-01-01T00:00:00Z'), password: 'no-guardar',
      persona: { token: 'no-guardar', nombre: 'QA' }, file: new File(['qa'], 'qa.pdf') });
    const datos = storage.leer(k);
    expect(datos.fecha instanceof Date).toBeTrue(); expect(datos.fecha.toISOString()).toBe('2014-01-01T00:00:00.000Z');
    expect(datos.password).toBeUndefined(); expect(datos.persona.token).toBeUndefined(); expect(datos.file).toBeUndefined();
  });
});
