import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatosHistoricos, ESTADOS_EXPEDIENTE, FUENTES_HISTORICAS, ReferenciaUsuario } from '../models/caso-historico.model';

@Component({
  selector: 'app-historico-info', imports: [CommonModule, MatIconModule], styleUrl: './historicos.css',
  template: `@if (caso?.origenCaso === 'HISTORICO') {
    <section class="historico-card historico-info" aria-label="Procedencia del caso">
      <span class="historico-chip"><mat-icon>history</mat-icon>Caso histórico</span>
      <dl class="historico-grid">
        <div><dt>Estado del expediente</dt><dd>{{ estado }}</dd></div>
        <div><dt>Fuente</dt><dd>{{ fuente }}</dd></div>
        <div><dt>Investigador original</dt><dd>{{ caso?.investigadorOriginal?.nombre || nombre(caso?.investigadorOriginal?.usuarioId) }}</dd></div>
        <div><dt>Incorporado por</dt><dd>{{ nombre(caso?.registradoPor) }}</dd></div>
        @if (caso?.fechaIncorporacionSistema) { <div><dt>Fecha de incorporación</dt><dd>{{ caso?.fechaIncorporacionSistema | date:'dd/MM/yyyy HH:mm' }}</dd></div> }
        @if (caso?.anioCaso) { <div><dt>Año del caso</dt><dd>{{ caso?.anioCaso }}</dd></div> }
        @if (caso?.observacionHistorica) { <div class="historico-full"><dt>Observación</dt><dd class="historico-observacion">{{ caso?.observacionHistorica }}</dd></div> }
      </dl>
    </section>
  }`,
})
export class HistoricoInfoComponent {
  @Input() caso: DatosHistoricos | null = null;
  get estado(): string { return ESTADOS_EXPEDIENTE.find(e => e.value === this.caso?.estadoExpedienteHistorico)?.label || 'No registrado'; }
  get fuente(): string { return FUENTES_HISTORICAS.find(f => f.value === this.caso?.fuenteInformacionHistorica)?.label || 'No registrada'; }
  nombre(usuario?: ReferenciaUsuario): string { return typeof usuario === 'object' && usuario ? usuario.nombre || 'No determinado' : usuario ? `Usuario ${usuario}` : 'No determinado'; }
}
