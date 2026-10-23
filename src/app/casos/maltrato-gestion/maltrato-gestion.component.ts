import { BorradorFormularioDirective } from '../../shared/borradores/borrador-formulario.directive';
import { CargaArchivoComponent } from '../../shared/components/carga-archivo/carga-archivo.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MaltratoGestionService } from './maltrato-gestion.service';
import { CAMPOS_MALTRATO } from './maltrato-campos';
import { GEOGRAFIA_ALERTA } from '../alerta-gestion/alerta-catalogos';

const MP=/^(?:(?:MPE01|M0008|MP004|M0030|MP001)-\d{4}-\d+|IC\/PNCORLLAT\d+-\d{4}-\d+)$/;
const fechaHoy=()=>new Date().toLocaleDateString('en-CA');
// Opciones verificadas en las columnas de catálogo del Excel; no incluyen nombres de personas.
const OPCIONES:Record<string,readonly string[]>={
  sexo:['HOMBRE','MUJER','NO INDICA'],etnia:['LADINO','MAYA','POR ESTABLECER'],
  nacionalidad:['GUATEMALTECA','POR ESTABLECER'],clasificacionCaso:['A','B','C','D'],
  tipoAtencion:['TURNO','FNNA','TURNO/DENUNCIA ANONIMA','110'],
  procedencia:['FISCALIA DE LA NIÑEZ Y ADOLESCENCIA VICTIMA DE MALTRATO','DENUNCIA ANONIMA','TUPISTA'],
  tipoDocumento:['REQUERIMIENTO','DENUNCIA TUPISTA','110'],
  unidadConoce:['SECCION DE INVESTIGACION DE NIÑEZ Y ADOLESCENCIA VICTIMA DE MALTRATO','ADOLESCENCIA VICTIMA DE MALTRATO'],
};

@Component({
  selector:'app-maltrato-gestion',
  imports:[BorradorFormularioDirective,CargaArchivoComponent,CommonModule,ReactiveFormsModule,RouterLink,MatFormFieldModule,MatInputModule,MatSelectModule,MatButtonModule,MatIconModule],
  templateUrl:'./maltrato-gestion.component.html',styleUrl:'./maltrato-gestion.component.css',
})
export default class MaltratoGestionComponent implements OnInit {
  private api=inject(MaltratoGestionService);
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
  readonly campos=CAMPOS_MALTRATO;
  readonly secciones=[...new Set(CAMPOS_MALTRATO.map(c=>c.section))];
  readonly datosPersona=[
    {key:'nombre',label:'Nombre completo',type:'text'},
    {key:'cui',label:'CUI, si se conoce',type:'text'},
    {key:'fecha_Nac',label:'Fecha de nacimiento, si se conoce',type:'date'},
    {key:'edadReportada',label:'Edad al recibir el caso',type:'number'},
    {key:'sexo',label:'Sexo',type:'text'},
    {key:'etnia',label:'Etnia',type:'text'},
    {key:'nacionalidad',label:'Nacionalidad',type:'text'},
    {key:'ocupacion',label:'Ocupación',type:'text'},
    {key:'direccion',label:'Dirección completa',type:'text'},
    {key:'zona',label:'Zona',type:'text'},
    {key:'departamento',label:'Departamento',type:'text'},
    {key:'municipio',label:'Municipio',type:'text'},
  ];
  readonly denunciante=[{key:'denuncianteNombre',label:'Nombre del denunciante'},{key:'denuncianteTelefono',label:'Teléfono del denunciante'},{key:'denuncianteParentesco',label:'Parentesco del denunciante con esta víctima'}];
  form=new FormGroup({
    numeroDeic:new FormControl('',[Validators.required,Validators.pattern(/^DEIC51-\d{4}-\d{2}-\d{2}-\d+$/)]),
    numeroMp:new FormControl('',Validators.pattern(MP)),
    fechaIngreso:new FormControl(fechaHoy(),Validators.required),
    investigadorAsignado:new FormControl('',Validators.required),
    estadoInvestigacion:new FormControl(''),
    victimas:new FormArray<FormGroup>([]),
    sindicados:new FormArray<FormGroup>([]),
    lugarHechos:new FormGroup({departamento:new FormControl(''),municipio:new FormControl(''),direccionDetallada:new FormControl('')}),
    fichaMaltrato:new FormGroup<any>(Object.fromEntries(CAMPOS_MALTRATO.map(c=>[c.key,new FormControl('',c.type==='number'?[Validators.min(0),Validators.max(1000000),Validators.pattern(/^\d+$/)]:[])]))),
  });
  constructor(){this.agregarPersona('victimas');}
  get editable(){return !this.id?this.analista:!!this.caso && !this.analista && (this.caso.expedienteEnPreparacion || this.caso.estadoRegistro==='Rechazado');}
  get nombreInvestigador(){return this.caso?.investigadorAsignado?.nombre || this.investigadores.find(u=>u._id===this.form.get('investigadorAsignado')?.value)?.nombre || 'Nombre no disponible';}
  personas(tipo:'victimas'|'sindicados'){return this.form.controls[tipo];}
  agregarPersona(tipo:'victimas'|'sindicados',datos:any={}){
    const controles:Record<string,FormControl>={};
    for(const c of this.datosPersona)controles[c.key]=new FormControl('',c.key==='nombre'?[Validators.required]:c.type==='number'?[Validators.min(0),Validators.max(130),Validators.pattern(/^\d+$/)]:[]);
    for(const c of this.denunciante)controles[c.key]=new FormControl('');
    controles['parentesco']=new FormControl('');
    const grupo=new FormGroup(controles);
    grupo.patchValue({...datos,fecha_Nac:datos.fecha_Nac?.slice(0,10)||null});
    this.personas(tipo).push(grupo);
  }
  retirarPersona(tipo:'victimas'|'sindicados',i:number){if(this.editable && (tipo==='sindicados'||this.personas(tipo).length>1))this.personas(tipo).removeAt(i);}
  opciones(key:string,grupo:FormGroup=this.form.controls.fichaMaltrato):readonly string[]|null {
    let lista:readonly string[]|undefined;
    if(key==='departamento')lista=Object.keys(GEOGRAFIA_ALERTA);
    else if(key==='municipio'){
      const normalizar=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
      const nombre=Object.keys(GEOGRAFIA_ALERTA).find(d=>normalizar(d)===normalizar(grupo.get('departamento')?.value||''));
      lista=nombre?GEOGRAFIA_ALERTA[nombre]:[];
    } else lista=OPCIONES[key];
    if(!lista)return null;
    const actual=grupo.get(key)?.value;
    return actual && !lista.includes(actual)?[actual,...lista]:lista;
  }
  cambiarDepartamento(grupo:FormGroup){grupo.get('municipio')?.setValue(null);}
  camposSeccion(seccion:string){return this.campos.filter(c=>c.section===seccion);}
  seccionVisible(seccion:string){return !!this.id || ['Recepción','Hechos'].includes(seccion);}
  ngOnInit(){
    if(this.id){
      this.cargando=true;this.form.disable();
      this.api.detalle(this.id).subscribe({next:c=>{
        this.caso=c;
        const datos={...c,fechaIngreso:c.fechaIngreso?.slice(0,10),investigadorAsignado:typeof c.investigadorAsignado==='object'?c.investigadorAsignado?._id:c.investigadorAsignado,fichaMaltrato:{...c.fichaMaltrato}};
        for(const campo of this.campos)if(campo.type==='date' && datos.fichaMaltrato[campo.key])datos.fichaMaltrato[campo.key]=datos.fichaMaltrato[campo.key].slice(0,10);
        this.personas('victimas').clear();this.personas('sindicados').clear();
        for(const v of c.victimas||[])this.agregarPersona('victimas',v);
        for(const v of c.infractores||[])this.agregarPersona('sindicados',v);
        delete datos.victimas;delete datos.sindicados;
        this.form.patchValue(datos);
        if(this.editable){this.form.enable();for(const key of ['numeroDeic','fechaIngreso','investigadorAsignado'])this.form.get(key)?.disable();}else this.form.disable();
        this.cargando=false;
      },error:e=>{this.cargando=false;this.error=this.mensaje(e);}});
    } else {this.cargarLista();if(!this.analista)this.form.disable();}
    this.usuarios.getInvestigadores().subscribe({next:usuarios=>this.investigadores=usuarios.filter(u=>u.activo!==false),error:()=>{if(this.analista && !this.id)this.error='No se pudo cargar el listado de investigadores. Vuelve a cargar la página.';}});
  }
  cargarLista(){this.cargando=true;this.api.listar().subscribe({next:r=>{this.registros=r;this.cargando=false;},error:e=>{this.error=this.mensaje(e);this.cargando=false;}});}
  mensaje(e:any){const m=e?.error?.message;return Array.isArray(m)?m.join('. '):typeof m==='string'?m:'No fue posible completar la operación. Intenta nuevamente.';}
  payload(){
    const limpiar=(v:any):any=>Array.isArray(v)?v.map(limpiar):typeof v==='object' && v!==null?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,limpiar(x)])):typeof v==='string'?(v.trim()||null):v;
    const datos=limpiar(this.form.getRawValue());
    if(this.id){delete datos.numeroDeic;delete datos.fechaIngreso;delete datos.investigadorAsignado;}
    return datos;
  }
  guardar(entregar=false){
    if(this.ocupado || !this.editable)return;
    if(this.form.invalid || !this.personas('victimas').length){this.form.markAllAsTouched();this.error='Revisa los campos obligatorios y los formatos indicados.';return;}
    if(entregar){
      const d=this.payload();
      if(!d.numeroMp || !d.estadoInvestigacion || !d.lugarHechos.departamento || !d.lugarHechos.municipio || !d.lugarHechos.direccionDetallada){this.error='Completa MP, estado de investigación y lugar de los hechos para enviar a revisión.';return;}
      if(d.victimas.some((v:any)=>!v.fecha_Nac && v.edadReportada==null)){this.error='Registra fecha de nacimiento o edad conocida de cada víctima.';return;}
      if(!this.file){this.error='Selecciona el expediente completo en PDF.';return;}
    }
    this.ocupado=true;this.error='';
    const revisionGuardada=JSON.stringify(this.form.getRawValue());
    const request=this.id?this.api.guardar(this.id,this.payload()):this.api.registrar(this.payload());
    request.subscribe({next:c=>{
      if(JSON.stringify(this.form.getRawValue())===revisionGuardada)this.form.markAsPristine();
      if(entregar && this.id){this.api.entregar(this.id,this.file!).subscribe({next:r=>{this.caso=r;this.file=null;this.form.disable();this.ocupado=false;this.snack.open('Expediente enviado al analista para revisión.','Cerrar',{duration:5000});},error:e=>{this.ocupado=false;this.error=this.mensaje(e);}});return;}
      this.ocupado=false;
      if(this.id)this.caso=c;
      else {this.form.reset({fechaIngreso:fechaHoy()});this.personas('victimas').clear();this.personas('sindicados').clear();this.agregarPersona('victimas');this.cargarLista();}
      this.snack.open(this.id?'Datos guardados. Puedes continuar más tarde.':'Caso registrado y asignado al investigador.','Cerrar',{duration:5000});
    },error:e=>{this.ocupado=false;this.error=this.mensaje(e);}});
  }
  seleccionar(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];this.file=null;if(file && file.type==='application/pdf')this.file=file;else if(file){this.error='Selecciona un archivo PDF.';input.value='';}}
  descargar(){if(this.ocupado)return;this.ocupado=true;this.api.exportar().subscribe({next:blob=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='base-maltrato.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.ocupado=false;},error:()=>{this.ocupado=false;this.error='No fue posible generar el Excel. Intenta nuevamente.';}});}
  prepararBorrador = (datos: any) => {
    for (const tipo of ["victimas","sindicados"] as const) {
      const cantidad = Array.isArray(datos[tipo]) ? datos[tipo].length : 0;
      while (this.personas(tipo).length < cantidad) this.agregarPersona(tipo);
      while (this.personas(tipo).length > cantidad) this.personas(tipo).removeAt(this.personas(tipo).length - 1);
    }
  };

}
