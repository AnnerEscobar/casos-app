import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CAMPOS_ALERTA } from './alerta-campos';

@Component({
  selector:'app-alerta-ficha-resumen',imports:[DatePipe],
  template:`
    @if(caso?.procesoAlerta){
      <section><h3>Datos del requerimiento y del expediente</h3>
        <dl><div><dt>Investigador asignado</dt><dd>{{caso.investigadorAsignado?.nombre || 'Nombre no disponible'}}</dd></div>
        <div><dt>Fecha de ingreso</dt><dd>{{caso.fechaIngreso | date:'dd/MM/yyyy':'UTC'}}</dd></div>
        <div><dt>Estado de investigación</dt><dd>{{caso.estadoInvestigacion || 'Sin indicar'}}</dd></div>
        @for(c of campos;track c.key){@if(caso.fichaAlerta?.[c.key] != null && caso.fichaAlerta[c.key] !== ''){
          <div><dt>{{c.label}}</dt><dd>{{c.type==='date'?(caso.fichaAlerta[c.key] | date:'dd/MM/yyyy':'UTC'):caso.fichaAlerta[c.key]}}</dd></div>
        }}</dl>
      </section>
    }
  `,
  styles:[`section{margin-top:24px}h3{font-weight:600;margin-bottom:16px}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}dt{font-size:12px;color:var(--v3-muted,#64748b)}dd{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:600px){dl{grid-template-columns:1fr}}`],
})
export class AlertaFichaResumenComponent {
  @Input() caso:any;
  readonly campos=CAMPOS_ALERTA;
}
