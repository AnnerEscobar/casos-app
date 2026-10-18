import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CAMPOS_CONFLICTO } from './conflicto-campos';

@Component({
  selector:'app-conflicto-ficha-resumen',imports:[DatePipe],
  template:`@if(caso?.procesoConflicto){<section><h3>Requerimiento y expediente de conflicto</h3><dl>
    <div><dt>Investigador asignado</dt><dd>{{caso.investigadorAsignado?.nombre || 'Sin nombre disponible'}}</dd></div>
    <div><dt>Fecha de recepción</dt><dd>{{caso.fechaIngreso | date:'dd/MM/yyyy':'UTC'}}</dd></div>
    <div><dt>Lugar de los hechos</dt><dd>{{caso.lugarHechos?.direccionDetallada}} · {{caso.lugarHechos?.municipio}} · {{caso.lugarHechos?.departamento}}</dd></div>
    @for(c of campos;track c.key){@if(caso.fichaConflicto?.[c.key] != null && caso.fichaConflicto[c.key] !== ''){<div><dt>{{c.label}}</dt><dd>{{c.type==='date'?(caso.fichaConflicto[c.key] | date:'dd/MM/yyyy':'UTC'):caso.fichaConflicto[c.key]}}</dd></div>}}
    </dl>
    @for(p of caso.infractores;track $index){<h4>Adolescente infractor {{$index+1}}: {{p.nombre}}</h4><dl>
      <div><dt>Edad reportada / alias / sexo</dt><dd>{{p.edadReportada ?? 'Sin indicar'}} · {{p.alias || 'Sin indicar'}} · {{p.sexo || 'Sin indicar'}}</dd></div>
      <div><dt>Domicilio / ocupación</dt><dd>{{p.direccion || 'Sin indicar'}} · {{p.ocupacion || 'Sin indicar'}}</dd></div>
      <div><dt>Padre / madre</dt><dd>{{p.nombrePadre || 'Sin indicar'}} · {{p.nombreMadre || 'Sin indicar'}}</dd></div>
      <div><dt>Estado físico</dt><dd>{{p.estadoFisico || 'Sin indicar'}}</dd></div>
    </dl>}
    @for(v of caso.victimas;track $index){<p><strong>{{v.tipoPersona==='DENUNCIANTE'?'Denunciante':'Víctima'}} {{$index+1}}:</strong> {{v.nombre}} · {{v.telefono || 'Teléfono sin indicar'}} · {{v.direccion || 'Dirección sin indicar'}}</p>}
    </section>}`,
  styles:[`section{margin-top:24px}h3,h4{font-weight:600;margin:16px 0}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}dt{font-size:12px;color:var(--v3-muted,#64748b)}dd{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:600px){dl{grid-template-columns:1fr}}`],
})
export class ConflictoFichaResumenComponent {
  @Input() caso:any;
  readonly campos=CAMPOS_CONFLICTO;
}
