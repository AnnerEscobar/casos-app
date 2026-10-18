import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CAMPOS_MALTRATO } from './maltrato-campos';

@Component({
  selector:'app-maltrato-ficha-resumen',imports:[DatePipe],
  template:`@if(caso?.procesoMaltrato){<section><h3>Requerimiento y expediente</h3><dl>
    <div><dt>Investigador asignado</dt><dd>{{caso.investigadorAsignado?.nombre || 'Sin nombre disponible'}}</dd></div>
    <div><dt>Fecha de recepción</dt><dd>{{caso.fechaIngreso | date:'dd/MM/yyyy':'UTC'}}</dd></div>
    <div><dt>Lugar de los hechos</dt><dd>{{caso.lugarHechos?.direccionDetallada}} · {{caso.lugarHechos?.municipio}} · {{caso.lugarHechos?.departamento}}</dd></div>
    @for(c of campos;track c.key){@if(caso.fichaMaltrato?.[c.key] != null && caso.fichaMaltrato[c.key] !== ''){<div><dt>{{c.label}}</dt><dd>{{c.type==='date'?(caso.fichaMaltrato[c.key] | date:'dd/MM/yyyy':'UTC'):caso.fichaMaltrato[c.key]}}</dd></div>}}
    </dl>
    @for(v of caso.victimas;track $index){<h4>Víctima {{$index+1}}: {{v.nombre}}</h4><dl>
      <div><dt>Edad al recibir el caso</dt><dd>{{v.edadReportada ?? 'Sin indicar'}}</dd></div>
      <div><dt>Sexo / etnia / nacionalidad</dt><dd>{{v.sexo || 'Sin indicar'}} · {{v.etnia || 'Sin indicar'}} · {{v.nacionalidad || 'Sin indicar'}}</dd></div>
      <div><dt>Ocupación</dt><dd>{{v.ocupacion || 'Sin indicar'}}</dd></div>
      <div><dt>Dirección</dt><dd>{{v.direccion}} · Zona {{v.zona || 'Sin indicar'}} · {{v.municipio}} · {{v.departamento}}</dd></div>
      <div><dt>Denunciante / teléfono / parentesco</dt><dd>{{v.denuncianteNombre || 'Sin indicar'}} · {{v.denuncianteTelefono || 'Sin indicar'}} · {{v.denuncianteParentesco || 'Sin indicar'}}</dd></div>
    </dl>}
    @for(s of caso.infractores;track $index){<p><strong>Sindicado {{$index+1}}:</strong> {{s.nombre}} · {{s.parentesco || 'Parentesco sin indicar'}}</p>}
    </section>}`,
  styles:[`section{margin-top:24px}h3,h4{font-weight:600;margin:16px 0}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}dt{font-size:12px;color:var(--v3-muted,#64748b)}dd{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:600px){dl{grid-template-columns:1fr}}`],
})
export class MaltratoFichaResumenComponent {
  @Input() caso:any;
  readonly campos=CAMPOS_MALTRATO;
}
