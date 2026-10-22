export type TipoCaso =
  | 'Alerta'
  | 'Maltrato'
  | 'Conflicto';

export type ModalidadMaltrato =
  | 'OFICIO'
  | 'REQUERIMIENTO';

export type EstadoDocumentacion =
  | 'BORRADOR'
  | 'PENDIENTE_REGISTRO'
  | 'EN_REVISION'
  | 'RECHAZADO'
  | 'REGISTRADO';


/* ======================================================
   CARÁTULA
====================================================== */

export interface DatosCaratula {
  numeroMp?: string;

  numeroAlerta?: string;

  nombre: string;

  edad?: string;

  fechaNac?: Date | string;

  lugar: string;

  departamento?: string;

  municipio?: string;

  observaciones?: string;
}


export interface CrearDocumentacionInicial {
  casoId?: string;
  tipoCaso: TipoCaso;

  numeroDeic: string;

  modalidadMaltrato?: ModalidadMaltrato;

  caratula: DatosCaratula;
}


/* ======================================================
   PLAN DE INVESTIGACIÓN
====================================================== */

export interface ElementoPlan {
  codigo: string;

  elemento: string;

  informacionObtenida: string;

  informacionNecesitaObtener: string;

  diligenciasRealizar: string;
}


export interface PlanInvestigacionResponse {
  mandoNombre?: string;
  documentacionId: string;

  numeroDeic: string;

  tipoCaso: TipoCaso;

  titulo: string;

  elementos: ElementoPlan[];

  observaciones: string;
}


export interface RespuestaPlan {
  codigo: string;

  informacionObtenida?: string;

  informacionNecesitaObtener?: string;

  diligenciasRealizar?: string;
}


export interface GuardarPlan {
  mandoNombre?: string;
  elementos: RespuestaPlan[];

  observaciones?: string;
}


/* ======================================================
   RÚBRICA
====================================================== */

export type TipoItemRubrica =
  | 'ITEM'
  | 'SECCION';


export interface ItemRubrica {
  codigo: string;

  descripcion: string;

  tipo: TipoItemRubrica;

  respuesta:
    | 'SI'
    | 'NO'
    | null;

  observaciones: string;
}


export interface RubricaResponse {
  dependenciaSupervisada?: string;
  supervisorNombre?: string;
  documentacionId: string;

  numeroDeic: string;

  tipoCaso: TipoCaso;

  modalidadMaltrato?: ModalidadMaltrato;

  tipoRubrica: string;

  titulo: string;

  preguntaProtocolo: string;

  conoceProtocolo:
    | 'SI'
    | 'NO'
    | null;

  items: ItemRubrica[];
}


export interface RespuestaRubrica {
  codigo: string;

  respuesta?:
    | 'SI'
    | 'NO';

  observaciones?: string;
}


export interface GuardarRubrica {
  dependenciaSupervisada?: string;
  supervisorNombre?: string;
  conoceProtocolo?:
    | 'SI'
    | 'NO';

  respuestas: RespuestaRubrica[];
}


/* ======================================================
   DOCUMENTO FINAL
====================================================== */

export interface DocumentoFinal {
  nombreArchivo?: string;

  driveFileId?: string;

  url?: string;

  fechaGeneracion?: string;
}


/* ======================================================
   DOCUMENTACIÓN INICIAL
====================================================== */

export interface DocumentacionInicial {
  _id: string;

  tipoCaso: TipoCaso;

  numeroDeic: string;

  modalidadMaltrato?: ModalidadMaltrato;

  estado: EstadoDocumentacion;

  pasoActual: number;

  investigadorId: string;

  investigadorNombre: string;

  caratula: DatosCaratula;

  documentoFinal?: DocumentoFinal;

  casoId?: string;

  createdAt?: string;

  updatedAt?: string;
}


/* ======================================================
   PAGINACIÓN
====================================================== */

export interface PaginationData {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
}


export interface PendientesResponse {
  items: DocumentacionInicial[];

  pagination: PaginationData;
}
