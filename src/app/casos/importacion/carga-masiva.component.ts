import { Component, Input, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environment.prod';

interface CasoImportacion { numeroDeic:string;filas:number[];estado:string;errores:string[];victimas:number;infractores:number;nombre:string;investigador:string }
interface CuentaImportacion {nombre:string;usuario:string;usuarioId?:string;estado:string;error?:string}
interface VistaImportacion { hojas:string[];hoja?:string;huella?:string;cuentas?:CuentaImportacion[];columnasSinMapear?:string[];casos?:CasoImportacion[];resumen?:{filas:number;casos:number;listos:number;importados:number;existentes:number;errores:number} }

@Component({
  selector:'app-carga-masiva',
  imports:[MatButtonModule,MatIconModule],
  styleUrl:'./carga-masiva.component.css',
  template:`<button class="accion-secundaria" type="button" mat-stroked-button (click)="abrir()"><mat-icon>upload_file</mat-icon>Carga masiva</button>`,
})
export class CargaMasivaComponent {
  @Input({required:true}) tipo!: 'alerta'|'maltrato'|'conflicto';
  private dialog=inject(MatDialog);
  abrir(){this.dialog.open(CargaMasivaDialogComponent,{data:this.tipo,width:'1100px',maxWidth:'96vw',autoFocus:'first-heading'});}
}

@Component({
  selector:'app-carga-masiva-dialog',
  imports:[MatDialogModule,MatButtonModule,FormsModule],
  styleUrl:'./carga-masiva.component.css',
  template:`<h2 mat-dialog-title tabindex="-1">Carga masiva de {{ etiqueta }}</h2>
  <mat-dialog-content>
    <p>Incorpora registros de Excel como casos históricos, sin PDF. Conserva al investigador original y permite vincular o crear su cuenta; no asigna un investigador actual. Los casos válidos quedan aprobados por el analista que realiza la carga.</p>
    @if(tipo==='maltrato'){<p><strong>Una fila por víctima:</strong> las filas con el mismo número DEIC se reúnen en un caso con varias víctimas. Los datos generales deben coincidir; las víctimas idénticas se conservan una sola vez.</p>}
    <p class="ayuda">Archivos XLSX, CSV UTF-8 o TXT/TSV tabulado, hasta 5 MB y 5,000 filas. Conserva los encabezados de la base. Fechas de texto: dd/mm/aaaa o aaaa-mm-dd. Se omiten los casos que ya existen; esta operación no actualiza sus datos.</p>
    <label>Archivo<input type="file" accept=".xlsx,.csv,.tsv,.txt" [disabled]="ocupado" (change)="seleccionar($event)"></label>
    <div class="opciones">
      @if(hojas.length){<label>Hoja de datos<select [(ngModel)]="hoja" (ngModelChange)="invalidar()" [disabled]="ocupado"><option value="">Selecciona una hoja</option>@for(h of hojas;track h){<option [value]="h">{{h}}</option>}</select></label>}
      <label>Disponibilidad del expediente original<select [(ngModel)]="estado" (ngModelChange)="invalidar()" [disabled]="ocupado"><option value="PARCIAL">Parcial: información de la base Excel</option><option value="NO_LOCALIZADO">Expediente no localizado</option></select></label>
    </div>
    <label class="confirmacion"><input type="checkbox" [(ngModel)]="crearInvestigadores" (ngModelChange)="cambiarCreacion()" [disabled]="ocupado">Crear las cuentas de investigadores que falten (las existentes se vinculan automáticamente).</label>
    @if(crearInvestigadores){<p class="ayuda">Usuario: nombre.apellido (ejemplo: anner.escobar). Contraseña temporal: nombre + 2026 (anner2026). Se exige cambiarla al primer ingreso. Revisa las propuestas, especialmente los nombres compuestos. Las cuentas existentes conservan su contraseña; las inactivas no se reactivan.</p>}
    <button class="accion-secundaria" mat-stroked-button type="button" [disabled]="ocupado || !archivo || !hoja" (click)="solicitar(false)">Revisar archivo</button>
    @if(ocupado){<p role="status">{{importando?'Importando casos. Espera el resultado…':'Revisando archivo…'}}</p>}
    @if(error){<p class="error" role="alert">{{error}}</p>}
    @if(cuentas.length){<h3>Cuentas de investigadores</h3><p class="ayuda">Se crean únicamente al confirmar casos válidos nuevos. El nombre de usuario sirve para iniciar sesión, sin necesidad de un correo. Después de modificar una propuesta, pulsa Revisar archivo.</p><div class="tabla"><table><thead><tr><th>Nombre del Excel</th><th>Usuario / correo</th><th>Resultado</th></tr></thead><tbody>@for(c of cuentas;track c.nombre){<tr><td>{{c.nombre}}</td><td>@if((c.estado==='nuevo' || (c.estado==='error' && !c.usuarioId)) && !terminado){<input type="text" [attr.aria-label]="'Usuario para '+c.nombre" [ngModel]="c.usuario" (ngModelChange)="editarCuenta(c,$event)" [disabled]="ocupado" maxlength="90">}@else{ {{c.usuario}} }</td><td>{{c.estado==='nuevo'?'Se creará':c.estado==='existente'?'Cuenta existente':c.estado==='creado'?'Creada':'Requiere corrección'}}@if(c.error){<small class="error">{{c.error}}</small>}</td></tr>}</tbody></table></div>}
    @if(vista?.resumen;as r){
      <p class="resumen" role="status">{{r.filas}} filas · {{r.casos}} casos agrupados · {{r.listos}} listos · {{r.importados}} importados · {{r.existentes}} existentes omitidos · {{r.errores}} con errores</p>
      @if(vista!.columnasSinMapear?.length){<details><summary>Columnas conservadas solo como información de origen</summary><p>{{vista!.columnasSinMapear!.join(' · ')}}</p><p class="ayuda">No se calculan edades, plazos ni estados a partir de estas columnas.</p></details>}
      <div class="tabla"><table><thead><tr><th>Filas</th><th>Número DEIC</th><th>Personas</th><th>Investigador original</th><th>Resultado</th></tr></thead><tbody>
        @for(c of vista!.casos;track $index){<tr><td>{{c.filas.join(', ')}}</td><td>{{c.numeroDeic || 'Sin DEIC'}}</td><td>{{c.nombre}}<small>{{c.victimas}} víctimas · {{c.infractores}} sindicados/infractores</small></td><td>{{c.investigador || 'Sin indicar'}}</td><td [class.error]="c.estado==='error'">{{etiquetaEstado(c.estado)}}@for(e of c.errores;track $index){<small>{{e}}</small>}</td></tr>}
      </tbody></table></div>
      @if(!terminado && r.listos){<label class="confirmacion"><input type="checkbox" [(ngModel)]="confirmado" [disabled]="ocupado">He revisado la vista previa. Importar los {{r.listos}} casos válidos y omitir los existentes y los que tienen errores.</label>}
      @if(terminado){<p>Conserva el resultado para corregir las filas con errores. Puedes volver a cargar el archivo; los casos ya incorporados se omitirán. Consulta los importados en la búsqueda de casos.</p><button class="accion-secundaria" mat-stroked-button type="button" [disabled]="ocupado" (click)="descargarCuentas()">Descargar listado de cuentas</button>}
      <button class="accion-secundaria" mat-stroked-button type="button" [disabled]="ocupado" (click)="descargarResultado()">Descargar resultado</button>
    }
  </mat-dialog-content>
  <mat-dialog-actions align="end"><button class="accion-cancelar" mat-button type="button" [disabled]="ocupado" (click)="ref.close()">{{terminado?'Cerrar':'Cancelar'}}</button><button class="accion-principal" mat-flat-button type="button" [disabled]="ocupado || !confirmado || terminado || !vista?.resumen?.listos" (click)="solicitar(true)">Importar casos válidos</button></mat-dialog-actions>`,
})
export class CargaMasivaDialogComponent {
  readonly tipo=inject<'alerta'|'maltrato'|'conflicto'>(MAT_DIALOG_DATA);
  readonly ref=inject(MatDialogRef<CargaMasivaDialogComponent>);
  private http=inject(HttpClient);
  readonly etiqueta={alerta:'alertas',maltrato:'maltrato',conflicto:'conflicto'}[this.tipo];
  archivo:File|null=null; hojas:string[]=[]; hoja=''; estado='PARCIAL'; ocupado=false;importando=false;error='';vista:VistaImportacion|null=null;confirmado=false;terminado=false;
  crearInvestigadores=true;cuentas:CuentaImportacion[]=[];ajustes:Record<string,string>={};
  cambiarCreacion(){this.cuentas=[];this.ajustes={};this.invalidar();}
  editarCuenta(c:CuentaImportacion,valor:string){c.usuario=valor;const clave=c.nombre.normalize('NFD').replace(/[\u0300-\u036f\u200b-\u200f\ufeff]/g,'').trim().replace(/\s+/g,' ').toUpperCase();this.ajustes[clave]=valor;this.invalidar();}
  invalidar(){this.vista=null;this.confirmado=false;this.terminado=false;this.error='';}
  seleccionar(event:Event){
    this.invalidar();this.cuentas=[];this.ajustes={};this.hojas=[];this.hoja='';this.archivo=null;
    const input=event.target as HTMLInputElement,f=input.files?.[0];if(!f)return;
    if(!/\.(xlsx|csv|tsv|txt)$/i.test(f.name) || f.size>5*1024*1024){this.error='Selecciona un XLSX, CSV, TSV o TXT de hasta 5 MB.';input.value='';return;}
    this.archivo=f;this.solicitar(false);
  }
  solicitar(importar:boolean){
    if(this.ocupado || !this.archivo || (importar && (!this.confirmado || !this.vista?.huella || this.terminado)))return;
    const data=new FormData();data.append('file',this.archivo);data.append('accion',importar?'importar':'vista-previa');data.append('estadoExpedienteHistorico',this.estado);
    data.append('crearInvestigadores',this.crearInvestigadores?'si':'no');
    if(this.crearInvestigadores && Object.keys(this.ajustes).length)data.append('cuentasPropuestas',JSON.stringify(this.ajustes));
    if(this.hoja)data.append('hoja',this.hoja);
    if(importar)data.append('huella',this.vista!.huella!);
    this.ocupado=true;this.importando=importar;this.ref.disableClose=true;this.error='';
    const ruta={alerta:'alertas',maltrato:'maltratos',conflicto:'conflictos'}[this.tipo];
    this.http.post<VistaImportacion>(environment.apiUrl+'/'+ruta+'/carga-masiva',data).subscribe({next:r=>{
      this.ocupado=false;this.ref.disableClose=false;this.hojas=r.hojas;this.vista=r.resumen?r:null;this.cuentas=r.cuentas||[];this.confirmado=false;
      if(importar)this.terminado=true;
      if(!this.hoja && r.hojas.length===1){this.hoja=r.hojas[0];this.solicitar(false);}
    },error:e=>{
      this.ocupado=false;this.ref.disableClose=false;this.confirmado=false;
      const m=e?.error?.message;this.error=Array.isArray(m)?m.join('. '):typeof m==='string'?m:'No se pudo completar la carga. Revisa la conexión y genera otra vista previa antes de reintentar.';
      if(importar){this.vista=null;this.error+=' Si la conexión se interrumpió, algunos casos pudieron haberse guardado. La siguiente revisión detectará los existentes.';}
    }});
  }
  etiquetaEstado(s:string){return ({listo:'Listo',error:'Requiere corrección',existente:'Ya existe: omitido',importado:'Importado'} as Record<string,string>)[s]||s;}
  descargarCuentas(){
    const contenido=this.cuentas.map(c=>`${c.nombre}\t${c.usuario}\t${c.estado}\t${c.error||''}`).join('\n');
    const url=URL.createObjectURL(new Blob(['Nombre\tUsuario / correo\tEstado\tDetalle\n'+contenido],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='cuentas-carga-'+this.tipo+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  descargarResultado(){
    if(!this.vista?.casos)return;
    // Neutraliza fórmulas al abrir el reporte CSV en una hoja de cálculo.
    const cell=(v:any)=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const rows=[['Filas','DEIC','Estado','Víctimas','Infractores','Errores'],...this.vista.casos.map(c=>[c.filas.join(', '),c.numeroDeic,this.etiquetaEstado(c.estado),c.victimas,c.infractores,c.errores.join(' | ')])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='resultado-carga-'+this.tipo+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
