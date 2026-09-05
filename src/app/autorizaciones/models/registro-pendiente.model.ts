export type TipoCaso =
  | 'Maltrato'
  | 'Alerta'
  | 'Conflicto';


export interface UsuarioRegistro {
  _id: string;
  nombre?: string;
  email?: string;
  role?: string;
}


export interface RegistroPendiente {
  _id: string;

  numeroDeic: string;

  numeroMp: string;

  estadoRegistro: string;

  registradoPor?: UsuarioRegistro | string | null;

  createdAt?: string;

  tipoCaso: TipoCaso;

  caso: any;
}