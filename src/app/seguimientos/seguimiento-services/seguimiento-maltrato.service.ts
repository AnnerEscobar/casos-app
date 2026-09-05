import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environment.prod';


export interface PersonaMaltratoSeguimiento {
  nombre: string;
  cui?: string;
  fecha_Nac?: string;
  direccion?: string;
}


export interface SeguimientoMaltrato {
  fecha?: string;
  estado?: string;
  archivos?: string[];
}


export interface CasoMaltratoSeguimiento {
  numeroDeic: string;
  numeroMp?: string;
  estadoInvestigacion: string;

  // Mongo mantiene "infractores",
  // pero en pantalla los mostramos como Sindicados.
  infractores?: PersonaMaltratoSeguimiento[];

  victimas?: PersonaMaltratoSeguimiento[];

  seguimientos?: SeguimientoMaltrato[];
}


@Injectable({
  providedIn: 'root'
})
export class SeguimientoMaltratoService {

  private apiUrl =
    `${environment.apiUrl}/maltratos`;

  constructor(
    private http: HttpClient
  ) {}


  buscarCasoPorDeic(
    numeroDeic: string
  ) {

    return this.http.get<CasoMaltratoSeguimiento>(
      `${this.apiUrl}/buscar/${numeroDeic}`
    );

  }


  enviarSeguimientoMaltrato(
    numeroDeic: string,
    data: FormData
  ) {

    return this.http.patch(
      `${this.apiUrl}/seguimiento/${numeroDeic}`,
      data
    );

  }

}
