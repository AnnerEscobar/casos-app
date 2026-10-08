import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { BandejaAccesosService, SolicitudBandeja } from './bandeja-accesos.service';
import { BusquedaService } from './search-profile/busqueda.service';
import { ExpedienteDialogComponent } from './components/expediente-dialog.component';

type Accion = 'AUTORIZADA' | 'RECHAZADA' | 'REVOCADA';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTabsModule, MatPaginatorModule],
  templateUrl: './solicitudes-acceso-page.component.html',
  styleUrls: ['./busquedas-v3.css', './solicitudes-acceso-page.component.css'],
})
export default class SolicitudesAccesoPageComponent implements OnInit {
  private bandeja = inject(BandejaAccesosService);
  private api = inject(BusquedaService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  solicitudes: SolicitudBandeja[] = [];
  cargando = true;
  errorCarga = false;
  mensaje = '';
  error = '';
  procesando = false;
  tab = 0;
  filtro = '';
  pagina = 0;
  tamano = 10;
  confirmacion: { solicitud: SolicitudBandeja; accion: Accion } | null = null;
  readonly estados = { PENDIENTE: 'Pendiente', AUTORIZADA: 'Autorizada', RECHAZADA: 'Rechazada', REVOCADA: 'Revocada' };
  ngOnInit() {
    this.bandeja.estado$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(estado => {
      this.solicitudes = estado.solicitudes; this.errorCarga = estado.error; this.cargando = false;
      this.pagina = Math.min(this.pagina, Math.max(0, Math.ceil(this.filtradas.length / this.tamano) - 1));
    });
  }
  get pendientes() { return this.solicitudes.filter(s => s.puedeResolver); }
  get propias() { return this.solicitudes.filter(s => s.propia); }
  get vigentes() { return this.solicitudes.filter(s => s.estado === 'AUTORIZADA' && s.puedeRevocar); }
  get filtradas() {
    const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = normalizar(this.filtro.trim());
    return [this.pendientes, this.propias, this.vigentes][this.tab].filter(s => normalizar([
      s.numeroDeic, s.persona, s.solicitante?.nombre, s.responsable?.nombre, s.motivo, this.estados[s.estado], s.tipo,
    ].join(' ')).includes(q));
  }
  get visibles() { return this.filtradas.slice(this.pagina * this.tamano, (this.pagina + 1) * this.tamano); }
  cambiarTab(tab: number) { this.tab = tab; this.pagina = 0; this.confirmacion = null; }
  actualizar() { this.cargando = true; this.bandeja.actualizar(); }
  abrir(s: SolicitudBandeja) {
    if (s.puedeVer) this.dialog.open(ExpedienteDialogComponent, { data: { _id: s.casoId, tipo: s.tipo }, width: '960px', maxWidth: 'calc(100vw - 24px)', maxHeight: '92dvh' });
  }
  preparar(s: SolicitudBandeja, accion: Accion) {
    if (this.procesando || !(accion === 'REVOCADA' ? s.puedeRevocar : s.puedeResolver)) return;
    this.confirmacion = { solicitud: s, accion }; this.error = ''; this.mensaje = '';
  }
  get verbo() { return this.confirmacion?.accion === 'AUTORIZADA' ? 'Autorizar acceso' : this.confirmacion?.accion === 'RECHAZADA' ? 'Rechazar solicitud' : this.confirmacion?.solicitud.propia ? 'Renunciar al permiso' : 'Revocar permiso'; }
  confirmar() {
    if (!this.confirmacion || this.procesando) return;
    const { solicitud, accion } = this.confirmacion;
    this.procesando = true;
    const peticion = accion === 'REVOCADA' ? this.api.revocar(solicitud._id) : this.api.resolver(solicitud._id, accion);
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.procesando = false; this.confirmacion = null; this.mensaje = 'El permiso se actualizó correctamente.'; },
      error: e => { this.procesando = false; this.error = e.error?.message || 'No se pudo actualizar el permiso.'; this.bandeja.actualizar(); },
    });
  }
}
