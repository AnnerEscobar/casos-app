import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { TablaExpedientesComponent } from './components/tabla-expedientes.component';
import { SolicitudesAccesoComponent } from './components/solicitudes-acceso.component';
import { ExpedienteDialogComponent } from './components/expediente-dialog.component';
import { BusquedaService } from './search-profile/busqueda.service';
import { AuthService } from '../auth/auth-service/auth.service';
import { personaExpediente } from './persona-expediente';

@Component({
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, TablaExpedientesComponent, SolicitudesAccesoComponent],
  styleUrls: ['./busquedas-v3.css'],
  template: `<main class="page-container">
    <header class="page-header"><div><h1 class="page-title">Expedientes compartidos</h1></div><a mat-button routerLink="/casos/Busquedas">Volver a búsquedas</a></header>
    <section class="section-card" *ngIf="investigador">
      <div class="results-header"><h2>Mis accesos</h2><button mat-stroked-button [disabled]="cargando" (click)="cargar()">Actualizar</button></div>
      <mat-form-field appearance="outline"><mat-label>Filtrar expedientes</mat-label><input matInput [(ngModel)]="filtro" (ngModelChange)="pagina=0" placeholder="DEIC, MP o persona"></mat-form-field>
      <p *ngIf="cargando" role="status">Cargando expedientes…</p><p *ngIf="error" role="alert">{{ error }}</p>
      <app-tabla-expedientes *ngIf="visibles.length" [casos]="visibles" (abrir)="abrir($event)"/>
      <p *ngIf="!cargando && !error && !filtrados.length">No hay expedientes para esta búsqueda.</p>
      <div class="filter-actions" *ngIf="filtrados.length"><span>{{ filtrados.length }} expedientes · Página {{ pagina + 1 }} de {{ paginas }}</span><div><button mat-button [disabled]="pagina===0" (click)="pagina=pagina-1">Anterior</button><button mat-button [disabled]="pagina+1>=paginas" (click)="pagina=pagina+1">Siguiente</button></div></div>
    </section>
    <app-solicitudes-acceso [expandido]="true" [ocultarRevocadas]="true" (cambio)="cargar()"/>
  </main>`,
})
export default class ExpedientesCompartidosComponent implements OnInit {
  private api = inject(BusquedaService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  casos: any[] = [];
  cargando = false;
  error = '';
  filtro = '';
  pagina = 0;
  get investigador() { return this.auth.getCurrentUser()?.role === 'Investigador'; }
  get filtrados() { const q = this.filtro.trim().toLowerCase(); return this.casos.filter(c => [c.numeroDeic, c.numeroMp, c.numeroAlerta, personaExpediente(c).nombre, c.investigador?.nombre].some(v => String(v || '').toLowerCase().includes(q))); }
  get paginas() { return Math.ceil(this.filtrados.length / 10); }
  get visibles() { return this.filtrados.slice(this.pagina * 10, (this.pagina + 1) * 10); }
  ngOnInit() { this.cargar(); }
  cargar() {
    if (!this.investigador || this.cargando) return;
    this.cargando = true;
    this.error = '';
    this.api.compartidos().subscribe({ next: casos => { this.casos = casos; this.pagina = 0; this.cargando = false; }, error: () => { this.cargando = false; this.casos = []; this.error = 'No se pudieron cargar los expedientes compartidos.'; } });
  }
  abrir(caso: any) { this.dialog.open(ExpedienteDialogComponent, { data: caso, width: '960px', maxWidth: 'calc(100vw - 24px)', maxHeight: '92dvh' }); }
}
