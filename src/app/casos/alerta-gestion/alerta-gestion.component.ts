import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth/auth-service/auth.service';
import { UserRole } from '../../auth/enums/user-role.enum';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { AlertaGestionService } from './alerta-gestion.service';
import { CAMPOS_ALERTA } from './alerta-campos';
import { GEOGRAFIA_ALERTA, OPCIONES_ALERTA } from './alerta-catalogos';

@Component({
  selector:'app-alerta-gestion',
  imports:[CommonModule,ReactiveFormsModule,RouterLink,MatFormFieldModule,MatInputModule,MatSelectModule,MatButtonModule,MatIconModule],
  templateUrl:'./alerta-gestion.component.html',styleUrl:'./alerta-gestion.component.css',
})
export default class AlertaGestionComponent implements OnInit {
  private api=inject(AlertaGestionService);
  private auth=inject(AuthService);
  private usuarios=inject(UsuariosService);
  private route=inject(ActivatedRoute);
  private snack=inject(MatSnackBar);
  readonly analista=this.auth.hasRole(UserRole.ANALISTA);
  readonly id=this.route.snapshot.paramMap.get('id');
  caso:any;
  registros:any[]=[];
  investigadores:any[]=[];
  ocupado=false;
  cargando=false;
  error='';
  file:File|null=null;
  readonly campos=CAMPOS_ALERTA;
  readonly secciones=[...new Set(CAMPOS_ALERTA.map(c=>c.section))];
  readonly base=[
    {key:'fecha_Nac',label:'Fecha de nacimiento',type:'date'},
    {key:'origenAlerta',label:'Origen de la alerta',type:'text'},
    {key:'casaHogar',label:'Casa hogar',type:'text'},
    {key:'ubicacionGps',label:'Coordenadas GPS',type:'text'},
  ];
  readonly localizacion=[
    {key:'fechaLocalizacion',label:'Fecha de localización',type:'date'},
    {key:'horaLocalizacion',label:'Hora de localización',type:'time'},
    {key:'direccionLocalizacion',label:'Dirección de localización',type:'text'},
    {key:'nombreAcompanante',label:'Nombre del acompañante',type:'text'},
    {key:'telefono',label:'Teléfono del acompañante',type:'text'},
  ];
  form=new FormGroup<any>({
    numeroDeic:new FormControl('',[Validators.required,Validators.pattern(/^DEIC52-\d{4}-\d{2}-\d{2}-\d+$/)]),
    numeroMp:new FormControl('',Validators.pattern(/^M0030-\d{4}-\d+$/)),
    numeroAlerta:new FormControl('',Validators.pattern(/^\d+-\d{4}$/)),
    nombreDesaparecido:new FormControl('',Validators.required),
    fechaIngreso:new FormControl(new Date().toLocaleDateString('en-CA'),Validators.required),
    investigadorAsignado:new FormControl('',Validators.required),
    estadoInvestigacion:new FormControl(''),
    direccion:new FormGroup({departamento:new FormControl(''),municipio:new FormControl(''),direccionDetallada:new FormControl('')}),
    denunciante:new FormGroup({nombre:new FormControl(''),cui:new FormControl(''),telefono:new FormControl('')}),
    fichaAlerta:new FormGroup(Object.fromEntries(CAMPOS_ALERTA.map(c=>[c.key,new FormControl('',c.type==='number'?[Validators.min(0),Validators.max(c.key==='edadReportada'?130:1000000),Validators.pattern(/^\d+$/)]:[])]))),
  });
  constructor(){
    for(const campo of [...this.base,...this.localizacion])this.form.addControl(campo.key,new FormControl(''));
    this.form.get('fichaAlerta.delegacion')?.setValue(OPCIONES_ALERTA['delegacion'][0]);
    this.form.get('fichaAlerta.tipoAlerta')?.setValue(OPCIONES_ALERTA['tipoAlerta'][0]);
  }
  opciones(key:string, grupo=''):readonly string[]|null {
    let opciones:readonly string[]|undefined;
    if(key==='departamento' || key==='departamentoLocalizacion') opciones=Object.keys(GEOGRAFIA_ALERTA);
    else if(key==='municipio' || key==='municipioLocalizacion') {
      const departamento=this.form.get(grupo==='direccion'?'direccion.departamento':'fichaAlerta.departamentoLocalizacion')?.value;
      const normalizar=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
      const nombre=Object.keys(GEOGRAFIA_ALERTA).find(d=>normalizar(d)===normalizar(departamento||''));
      opciones=nombre?GEOGRAFIA_ALERTA[nombre]:[];
    } else opciones=OPCIONES_ALERTA[key];
    if(!opciones)return null;
    const actual=this.form.get(grupo?grupo+'.'+key:key)?.value;
    return actual && !opciones.includes(actual)?[actual,...opciones]:opciones;
  }
  cambiarDepartamento(grupo:string){this.form.get(grupo==='direccion'?'direccion.municipio':'fichaAlerta.municipioLocalizacion')?.setValue(null);}

  get editable(){return !this.id ? this.analista : !!this.caso && !this.analista && (this.caso.expedienteEnPreparacion || this.caso.estadoRegistro==='Rechazado');}
  get nombreInvestigador(){return this.caso?.investigadorAsignado?.nombre || this.investigadores.find(u=>u._id===this.form.get('investigadorAsignado')?.value)?.nombre || 'Nombre no disponible';}
  camposSeccion(seccion:string){return this.campos.filter(c=>c.section===seccion && (this.analista || c.key!=='observacionesAnalista'));}
  seccionVisible(seccion:string){return !!this.id || ['Recepción','Persona desaparecida','Desaparición'].includes(seccion);}
  ngOnInit(){
    if(this.id){
      this.cargando=true;
      this.form.disable();
      this.api.detalle(this.id).subscribe({next:c=>{
        this.caso=c;
        const datos={...c,investigadorAsignado:typeof c.investigadorAsignado==='object'?c.investigadorAsignado._id:c.investigadorAsignado};
        for(const key of ['fechaIngreso','fecha_Nac','fechaLocalizacion']) if(datos[key])datos[key]=datos[key].slice(0,10);
        datos.fichaAlerta={...c.fichaAlerta};
        for(const campo of this.campos)if(campo.type==='date' && datos.fichaAlerta[campo.key])datos.fichaAlerta[campo.key]=datos.fichaAlerta[campo.key].slice(0,10);
        this.form.patchValue(datos);
        if(this.editable){this.form.enable();for(const key of ['numeroDeic','fechaIngreso','investigadorAsignado'])this.form.get(key)?.disable();}
        this.cargando=false;
      },error:e=>{this.cargando=false;this.error=this.mensaje(e);}});
    } else {this.cargarLista();if(!this.analista)this.form.disable();}
    this.usuarios.getInvestigadores().subscribe({next:usuarios=>this.investigadores=usuarios.filter(u=>u.activo!==false),error:()=>{if(this.analista && !this.id)this.error='No se pudo cargar el listado de investigadores. Vuelve a cargar la página.';}});
  }
  cargarLista(){this.cargando=true;this.api.listar().subscribe({next:r=>{this.registros=r;this.cargando=false;},error:e=>{this.error=this.mensaje(e);this.cargando=false;}});}
  mensaje(e:any){const m=e?.error?.message;return Array.isArray(m)?m.join('. '):typeof m==='string'?m:'No fue posible completar la operación. Intenta nuevamente.';}
  payload(){
    const d=this.form.getRawValue();
    const limpiar=(v:any):any=>typeof v==='object' && v!==null?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,limpiar(x)])):typeof v==='string'?(v.trim()||null):v;
    const datos=limpiar(d);
    if(this.id){delete datos.numeroDeic;delete datos.fechaIngreso;delete datos.investigadorAsignado;delete datos.fichaAlerta.observacionesAnalista;}
    return datos;
  }
  guardar(entregar=false){
    if(this.ocupado || !this.editable)return;
    if(entregar && !this.analista){
      const requeridos:Record<string,string>={numeroMp:'número MP',numeroAlerta:'número de alerta',fecha_Nac:'fecha de nacimiento',estadoInvestigacion:'estado de investigación','direccion.departamento':'departamento','direccion.municipio':'municipio','direccion.direccionDetallada':'dirección detallada'};
      const faltantes=Object.entries(requeridos).filter(([key])=>!String(this.form.get(key)?.value??'').trim());
      if(faltantes.length){
        for(const [key] of faltantes)this.form.get(key)?.markAsTouched();
        this.error='Para registrar y enviar a revisión completa: '+faltantes.map(([,label])=>label).join(', ')+'.';
        return;
      }
    }
    if(this.form.invalid){this.form.markAllAsTouched();this.error='Revisa los campos obligatorios y los formatos indicados.';return;}
    if(entregar && !this.file){this.error='Selecciona el expediente completo en PDF.';return;}
    this.ocupado=true;this.error='';
    const request=this.id?this.api.guardar(this.id,this.payload()):this.api.registrar(this.payload());
    request.subscribe({next:c=>{
      if(entregar && this.id){this.api.entregar(this.id,this.file!).subscribe({next:entregado=>{this.caso=entregado;this.file=null;this.form.disable();this.ocupado=false;this.snack.open('Expediente enviado al analista para revisión.','Cerrar',{duration:5000});},error:e=>{this.ocupado=false;this.error=this.mensaje(e);}});return;}
      this.ocupado=false;
      if(this.id)this.caso=c;
      else {this.form.reset({fechaIngreso:new Date().toLocaleDateString('en-CA'),fichaAlerta:{delegacion:OPCIONES_ALERTA['delegacion'][0],tipoAlerta:OPCIONES_ALERTA['tipoAlerta'][0]}});this.cargarLista();}
      this.snack.open(this.id?'Datos guardados. Puedes continuar más tarde.':'Alerta registrada y asignada al investigador.','Cerrar',{duration:5000});
    },error:e=>{this.ocupado=false;this.error=this.mensaje(e);}});
  }
  seleccionar(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];this.file=null;if(file && file.type==='application/pdf')this.file=file;else if(file){this.error='Selecciona un archivo PDF.';input.value='';}}
  descargar(){
    if(this.ocupado)return;
    this.ocupado=true;this.api.exportar().subscribe({next:blob=>{
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='base-alertas.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.ocupado=false;
    },error:()=>{this.ocupado=false;this.error='No fue posible generar el Excel. Intenta nuevamente.';}});
  }
}
