import { AfterViewInit, Directive, ElementRef, EventEmitter, inject, Input, OnDestroy, Output, Renderer2, Self } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, FormGroupDirective, PristineChangeEvent } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth-service/auth.service';
import { BorradoresService } from './borradores.service';

@Directive({ selector: 'form[appBorrador]', standalone: true, exportAs: 'borrador' })
export class BorradorFormularioDirective implements AfterViewInit, OnDestroy {
  @Input() appBorrador = '';
  @Input() prepararBorrador?: (datos: any) => void;
  @Output() borradorRecuperado = new EventEmitter<void>();
  private auth = inject(AuthService);
  private router = inject(Router);
  private storage = inject(BorradoresService);
  private renderer = inject(Renderer2);
  private host = inject(ElementRef);
  private cambios = new Subscription();
  private clave = '';
  private aviso?: HTMLElement;
  private destruido = false;
  private iniciado = false;
  private reiniciando = false;
  constructor(@Self() private grupo: FormGroupDirective) {}

  ngAfterViewInit() {
    this.cambios.add(this.grupo.control.events.subscribe(evento => {
      if (evento instanceof PristineChangeEvent && evento.pristine) this.limpiar();
    }));
    this.cambios.add(this.grupo.control.statusChanges.subscribe(() => this.programarInicio()));
    this.programarInicio();
  }
  private programarInicio() {
    // El componente termina de cargar sus datos y construir filas antes de restaurar.
    queueMicrotask(() => {
      if (this.destruido || this.iniciado) return;
      const user = this.auth.getCurrentUser();
      const id = user?.userId;
      if (!id || this.grupo.control.disabled) return;
      this.iniciado = true;
      this.clave = this.storage.clave(String(id), this.router.url + ':' + this.appBorrador);
      try {
        const datos = this.storage.leer(this.clave);
        if (datos) {
          this.prepararBorrador?.(datos);
          this.restaurar(this.grupo.control, datos);
          this.grupo.control.markAsDirty();
          this.mostrar('Borrador local recuperado. Revisa los datos y vuelve a seleccionar los archivos adjuntos.');
          this.borradorRecuperado.emit();
        }
      } catch { this.mostrar('No se pudo recuperar el borrador local.'); }
      this.cambios.add(this.grupo.control.valueChanges.subscribe(() => {
        if (!this.grupo.control.dirty || this.grupo.control.disabled) return;
        try { this.storage.guardar(this.clave, this.grupo.control.getRawValue()); }
        catch { this.mostrar('No se pudo guardar el borrador en este navegador. Guarda los datos antes de salir.'); }
      }));
    });
  }

  // Se respetan campos bloqueados por el servidor y los validadores de cada fila.
  private restaurar(control: AbstractControl, datos: any) {
    if (control.disabled) return;
    if (control instanceof FormGroup) {
      for (const [key, hijo] of Object.entries(control.controls)) if (Object.prototype.hasOwnProperty.call(datos || {}, key)) this.restaurar(hijo, datos[key]);
    } else if (control instanceof FormArray) {
      if (!Array.isArray(datos) || control.length !== datos.length) throw new Error('Las filas del borrador no coinciden.');
      control.controls.forEach((hijo, i) => this.restaurar(hijo, datos[i]));
    } else control.setValue(datos);
  }
  limpiar() {
    // FormGroup.reset limpia valores, pero el contenedor conserva submitted=true.
    // Reiniciar el contenedor evita errores rojos en el siguiente registro vacío.
    if (this.grupo.submitted && !this.reiniciando) {
      this.reiniciando = true;
      try { this.grupo.resetForm(this.grupo.control.getRawValue()); }
      finally { this.reiniciando = false; }
    }
    try { if (this.clave) this.storage.eliminar(this.clave); }
    catch { this.mostrar('No se pudo eliminar la copia local de este navegador.'); return; }
    if (this.aviso) { this.renderer.removeChild(this.host.nativeElement, this.aviso); this.aviso = undefined; }
  }
  private mostrar(texto: string) {
    if (!this.aviso) {
      this.aviso = this.renderer.createElement('p');
      this.renderer.setAttribute(this.aviso, 'role', 'status');
      this.renderer.insertBefore(this.host.nativeElement, this.aviso, this.host.nativeElement.firstChild);
    }
    this.renderer.setProperty(this.aviso, 'textContent', texto);
  }
  ngOnDestroy() { this.destruido = true; this.cambios.unsubscribe(); }
}
