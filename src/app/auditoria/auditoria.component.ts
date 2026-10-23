import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuditoriaService, EventoAuditoria } from './auditoria.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './auditoria.component.html', styleUrl: './auditoria.component.css',
})
export default class AuditoriaComponent implements OnInit {
  private api = inject(AuditoriaService);
  private destroyRef = inject(DestroyRef);
  filtros: Record<string, string> = this.vacios();
  private aplicados: Record<string, string> = {};
  registros: EventoAuditoria[] = [];
  seleccionado: EventoAuditoria | null = null;
  pagina = 1; total = 0; cargando = false; error = '';
  readonly recursos = ['CasosAlerta', 'CasosMaltrato', 'CasosConflicto', 'DocumentacionInicial', 'Caratula', 'Informe', 'SolicitudAcceso', 'Usuario', 'HTTP'];
  readonly acciones = ['CREAR', 'MODIFICAR', 'ELIMINAR', 'CONSULTAR', 'DESCARGAR', 'INICIAR_SESION', 'CERRAR_SESION', 'SOLICITUD'];
  ngOnInit() { this.buscar(); }
  private vacios() { return { numeroDeic: '', usuario: '', usuarioId: '', recurso: '', accion: '', resultado: '', desde: '', hasta: '', campo: '', anterior: '', nuevo: '', solicitudId: '' }; }
  buscar() {
    if (this.cargando) return;
    if (this.filtros['desde'] && this.filtros['hasta'] && this.filtros['desde'] > this.filtros['hasta']) {
      this.error = 'La fecha inicial debe ser anterior a la final.'; return;
    }
    this.aplicados = { ...this.filtros };
    for (const key of ['desde', 'hasta']) {
      if (this.aplicados[key]) this.aplicados[key] = new Date(`${this.aplicados[key]}:00-06:00`).toISOString();
    }
    this.cargar(1);
  }
  limpiar() { if (!this.cargando) { this.filtros = this.vacios(); this.buscar(); } }
  cargar(pagina: number) {
    if (this.cargando) return;
    this.cargando = true; this.error = ''; this.seleccionado = null;
    this.api.buscar(this.aplicados, pagina).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.registros = data.registros; this.total = data.total; this.pagina = data.pagina; this.cargando = false; },
      error: err => {
        this.registros = []; this.total = 0; this.cargando = false;
        this.error = err.status === 403 ? 'Tu usuario no tiene permiso para consultar la bitácora.' : 'No se pudo consultar la bitácora. Intenta nuevamente.';
      },
    });
  }
  get paginas() { return Math.max(1, Math.ceil(this.total / 25)); }
  valor(value: unknown) { return value === null || value === undefined ? 'Sin valor' : typeof value === 'object' ? JSON.stringify(value) : String(value); }
  duracion(segundos: number) {
    const minutos = Math.floor(segundos / 60);
    return `${Math.floor(minutos / 60)} h ${minutos % 60} min ${segundos % 60} s`;
  }
  nombreCampo(campo: string) {
    return ({ estadoInvestigacion: 'Estado de investigación', estadoRegistro: 'Estado de revisión', investigadorAsignado: 'Investigador asignado', expedienteEnPreparacion: 'Expediente en preparación' } as Record<string, string>)[campo] || campo;
  }
}
