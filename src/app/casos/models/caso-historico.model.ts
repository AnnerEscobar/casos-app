export type TipoCaso = 'alerta' | 'maltrato' | 'conflicto';
export type OrigenCaso = 'SISTEMA' | 'HISTORICO';
export type EstadoExpedienteHistorico = 'COMPLETO' | 'PARCIAL' | 'NO_LOCALIZADO';
export type FuenteInformacionHistorica = 'EXPEDIENTE_FISICO' | 'COPIA_ANALISIS' | 'REGISTRO_EXCEL' | 'NUEVO_REQUERIMIENTO' | 'OTRO';
export interface UsuarioReferencia { _id: string; nombre?: string; role?: string; activo?: boolean }
export type ReferenciaUsuario = string | UsuarioReferencia | null;
export interface DatosHistoricos {
  origenCaso?: OrigenCaso;
  estadoExpedienteHistorico?: EstadoExpedienteHistorico;
  fuenteInformacionHistorica?: FuenteInformacionHistorica;
  observacionHistorica?: string;
  anioCaso?: number;
  investigadorOriginal?: { usuarioId?: ReferenciaUsuario; nombre?: string } | null;
  registradoPor?: ReferenciaUsuario;
  fechaIncorporacionSistema?: string;
}
export interface PersonaCaso { nombre?: string; cui?: string; fecha_Nac?: string; direccion?: string }
export interface SeguimientoCaso {
  fecha?: string; estado?: string; nuevoEstado?: string; archivos?: string[];
  registradoPor?: ReferenciaUsuario; investigadorAsignado?: ReferenciaUsuario;
  nombreAcompanante?: string; telefono?: string; direccionLocalizacion?: string;
}
export interface CasoSeguimiento extends DatosHistoricos {
  _id?: string; numeroDeic: string; numeroMp?: string; numeroAlerta?: string;
  estadoInvestigacion?: string; estadoRegistro?: string;
  victimas?: PersonaCaso[]; infractores?: PersonaCaso[];
  nombreDesaparecido?: string; desaparecido?: { nombre?: string };
  fecha_Nac?: string; denunciante?: { nombre?: string; cui?: string; telefono?: string };
  seguimientos?: SeguimientoCaso[];
}
export interface CrearHistorico extends Omit<DatosHistoricos, 'registradoPor' | 'fechaIncorporacionSistema' | 'investigadorOriginal'> {
  origenCaso: 'HISTORICO'; numeroDeic: string; numeroMp?: string; numeroAlerta?: string;
  estadoExpedienteHistorico: EstadoExpedienteHistorico;
  investigadorOriginal?: { usuarioId?: string; nombre?: string };
  estadoInvestigacion?: string; victimas?: PersonaCaso[]; sindicados?: PersonaCaso[]; infractores?: PersonaCaso[];
  nombreDesaparecido?: string; fecha_Nac?: string; origenAlerta?: string; casaHogar?: string; ubicacionGps?: string;
  denunciante?: { nombre?: string; cui?: string; telefono?: string };
  lugarHechos?: { departamento?: string; municipio?: string; direccionDetallada?: string };
  lugarDesaparicion?: { departamento?: string; municipio?: string; direccionDetallada?: string };
  datosLocalizacion?: { direccionLocalizacion?: string; nombrePersonaConQuienEstaba?: string; telefono?: string; horaLocalizacion?: string; fechaLocalizacion?: string };
}
export interface RespuestaSeguimiento { seguimiento: SeguimientoCaso; mensaje?: string; message?: string }
export const ESTADOS_EXPEDIENTE = [
  { value: 'COMPLETO', label: 'Expediente completo', detalle: 'Se cuenta con suficiente información del expediente original para registrar los datos principales.' },
  { value: 'PARCIAL', label: 'Expediente parcial', detalle: 'Solamente se dispone de una parte del expediente o algunos datos.' },
  { value: 'NO_LOCALIZADO', label: 'Expediente no localizado', detalle: 'El expediente original no pudo localizarse; se cuenta con el nuevo requerimiento o información mínima.' },
] as const;
export const FUENTES_HISTORICAS = [
  { value: 'EXPEDIENTE_FISICO', label: 'Expediente físico' },
  { value: 'COPIA_ANALISIS', label: 'Copia proporcionada por Análisis' },
  { value: 'REGISTRO_EXCEL', label: 'Registro anterior en Excel' },
  { value: 'NUEVO_REQUERIMIENTO', label: 'Nuevo requerimiento' },
  { value: 'OTRO', label: 'Otro' },
] as const;
