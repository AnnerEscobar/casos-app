import { AfterViewInit, Directive, EventEmitter, inject, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth-service/auth.service';
import { BorradoresService } from './borradores.service';

// Complementa los formularios reactivos para editores por secciones con ngModel.
@Directive({ selector: '[appBorradorEstado]', standalone: true, exportAs: 'borradorEstado' })
export class BorradorEstadoDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() appBorradorEstado = '';
  @Input() borradorDisponible = true;
  @Input() capturarBorrador!: () => any;
  @Output() recuperarEstado = new EventEmitter<any>();
  private storage = inject(BorradoresService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private clave = '';
  private listo = false;
  private destruido = false;
  private recuperado = false;
  ngAfterViewInit() { this.listo = true; this.iniciar(); }
  ngOnChanges() { if (this.listo) this.iniciar(); }
  private iniciar() {
    queueMicrotask(() => {
      if (this.destruido || this.recuperado || !this.borradorDisponible) return;
      const usuario = this.auth.getCurrentUser()?.userId;
      if (!usuario) return;
      this.clave = this.storage.clave(usuario, this.router.url + ':' + this.appBorradorEstado);
      this.recuperado = true;
      try {
        const datos = this.storage.leer(this.clave);
        if (datos) this.recuperarEstado.emit(datos);
      } catch { /* No interrumpir la consulta de los datos guardados en el servidor. */ }
    });
  }
  guardar() {
    queueMicrotask(() => {
      if (this.destruido || !this.clave || !this.borradorDisponible) return;
      const datos = this.capturarBorrador();
      if (datos === undefined) return;
      try { this.storage.guardar(this.clave, datos); }
      catch { this.recuperarEstado.emit({ errorBorrador: true }); }
    });
  }
  confirmar(campo: string) {
    if (!this.clave) return;
    try {
      const datos = this.storage.leer(this.clave);
      if (datos) { delete datos[campo]; this.storage.guardar(this.clave, datos); }
    } catch { this.recuperarEstado.emit({ errorBorrador: true }); }
  }
  ngOnDestroy() { this.destruido = true; }
}
