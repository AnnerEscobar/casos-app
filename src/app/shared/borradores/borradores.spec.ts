import { Component } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth-service/auth.service';
import { BorradoresService } from './borradores.service';
import { BorradorFormularioDirective } from './borrador-formulario.directive';
import { BorradorEstadoDirective } from './borrador-estado.directive';

@Component({ imports: [ReactiveFormsModule, BorradorFormularioDirective, BorradorEstadoDirective], template: `
  <form appBorrador="caso" [formGroup]="form" [prepararBorrador]="preparar">
    <input formControlName="nombre"><input formControlName="password">
  </form>
  <div appBorradorEstado="plan" #editor="borradorEstado" [capturarBorrador]="capturar" (recuperarEstado)="estado = $event">
    <button (click)="editor.guardar()">Guardar copia</button>
  </div>` })
class Pantalla {
  form = new FormGroup({ nombre: new FormControl('', Validators.required), password: new FormControl(''), fecha: new FormControl<Date | null>(null),
    deic: new FormControl({ value: 'DEIC-SERVIDOR', disabled: true }), personas: new FormArray<FormGroup>([]) });
  estado: any = { texto: '' };
  capturar = () => this.estado;
  preparar = (datos: any) => {
    this.form.controls.personas.clear();
    for (const _ of datos.personas || []) this.form.controls.personas.push(new FormGroup({ nombre: new FormControl('', Validators.required) }));
  };
}

describe('Borradores personales al reingresar', () => {
  let propietario = 'usuario-1';
  let storage: BorradoresService;
  const router = { url: '/casos/alerta-expediente/caso-1' };
  const claves: string[] = [];
  beforeEach(() => {
    propietario = 'usuario-1'; router.url = '/casos/alerta-expediente/caso-1';
    TestBed.configureTestingModule({ imports: [Pantalla], providers: [
      { provide: Router, useValue: router }, { provide: AuthService, useValue: { getCurrentUser: () => ({ userId: propietario }) } },
    ] });
    storage = TestBed.inject(BorradoresService);
    for (const usuario of ['usuario-1', 'usuario-2']) for (const sufijo of ['caso', 'plan']) {
      const key = storage.clave(usuario, router.url + ':' + sufijo); claves.push(key); storage.eliminar(key);
    }
  });
  afterEach(() => { for (const key of claves) storage.eliminar(key); });
  function crear() { const f = TestBed.createComponent(Pantalla); f.detectChanges(); flushMicrotasks(); return f; }
  it('guarda al escribir y recupera los inputs tras destruir la pantalla y volver a entrar', fakeAsync(() => {
    const f = crear(); const input = f.nativeElement.querySelector('input');
    input.value = 'Caso a medias'; input.dispatchEvent(new Event('input'));
    f.destroy();
    const nueva = crear();
    expect(nueva.componentInstance.form.value.nombre).toBe('Caso a medias');
    expect(nueva.nativeElement.textContent).toContain('Borrador local recuperado');
  }));
  it('separa usuarios y expedientes del mismo navegador', fakeAsync(() => {
    const f = crear(); f.componentInstance.form.markAsDirty(); f.componentInstance.form.patchValue({ nombre: 'Privado' }); f.destroy();
    propietario = 'usuario-2'; const otraCuenta = crear(); expect(otraCuenta.componentInstance.form.value.nombre).toBe(''); otraCuenta.destroy();
    propietario = 'usuario-1'; router.url = '/casos/alerta-expediente/caso-2';
    const otroCaso = crear(); expect(otroCaso.componentInstance.form.value.nombre).toBe('');
  }));
  it('recupera filas con sus validadores y fechas, respetando campos bloqueados por el servidor', fakeAsync(() => {
    const key = storage.clave(propietario, router.url + ':caso');
    storage.guardar(key, { nombre: 'Nombre', fecha: new Date('2026-10-22T12:00:00Z'), deic: 'DEIC-VIEJO', personas: [{ nombre: 'Ana' }, { nombre: '' }] });
    const f = crear(), form = f.componentInstance.form;
    expect(form.controls.fecha.value instanceof Date).toBeTrue();
    expect(form.controls.deic.value).toBe('DEIC-SERVIDOR');
    expect(form.controls.personas.length).toBe(2);
    expect(form.controls.personas.at(1).invalid).toBeTrue();
  }));
  it('no guarda contraseñas ni archivos y no limpia ante un envío fallido', fakeAsync(() => {
    const f = crear(); f.componentInstance.form.markAsDirty(); f.componentInstance.form.patchValue({ nombre: 'Pendiente', password: 'secreto' });
    const key = storage.clave(propietario, router.url + ':caso');
    expect(localStorage.getItem(key)).not.toContain('secreto');
    f.componentInstance.form.setErrors({ servidor: true });
    expect(storage.leer(key).nombre).toBe('Pendiente');
    storage.guardar(key, { file: new File(['pdf'], 'adjunto.pdf') });
    expect(storage.leer(key).file).toBeUndefined();
  }));
  it('borra la copia al confirmar guardado y marcar el formulario como limpio', fakeAsync(() => {
    const f = crear(); f.componentInstance.form.markAsDirty(); f.componentInstance.form.patchValue({ nombre: 'Guardado' });
    const key = storage.clave(propietario, router.url + ':caso');
    expect(storage.leer(key)).toBeTruthy();
    f.componentInstance.form.markAsPristine();
    expect(storage.leer(key)).toBeNull();
  }));
  it('el registro exitoso limpia submitted y touched, conservando los campos obligatorios para el próximo envío', fakeAsync(() => {
    const f = crear(), form = f.componentInstance.form;
    const contenedor = f.debugElement.children[0].injector.get(FormGroupDirective);
    form.markAsDirty(); form.patchValue({ nombre: 'Registro completo' });
    form.markAllAsTouched();
    f.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(contenedor.submitted).toBeTrue();
    form.reset();
    expect(contenedor.submitted).toBeFalse();
    expect(form.untouched).toBeTrue();
    expect(form.controls.nombre.hasError('required')).toBeTrue();
    f.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(contenedor.submitted).toBeTrue();
    expect(form.invalid).toBeTrue();
  }));
  it('recupera texto de editores por secciones y elimina solo la parte confirmada', fakeAsync(() => {
    const f = crear(); f.componentInstance.estado = { plan: { texto: 'Pendiente' }, rubrica: { respuesta: 'SI' } };
    f.nativeElement.querySelector('button').click(); flushMicrotasks(); f.destroy();
    const nueva = crear(); expect(nueva.componentInstance.estado.plan.texto).toBe('Pendiente');
    const key = storage.clave(propietario, router.url + ':plan');
    const editor = nueva.debugElement.children[1].injector.get(BorradorEstadoDirective);
    editor.confirmar('plan');
    expect(storage.leer(key).plan).toBeUndefined();
    expect(storage.leer(key).rubrica.respuesta).toBe('SI');
  }));
});
