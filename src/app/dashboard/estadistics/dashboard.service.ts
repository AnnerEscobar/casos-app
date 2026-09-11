import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environment.prod';


export interface DashboardAutorizacionDetalle {
  total: number;
  alertas: number;
  maltratos: number;
  conflictos: number;
}


export interface DashboardResponse {

  alcance:
    'PERSONAL' |
    'GLOBAL';

  role: string;

  alertas: any[];

  maltratos: any[];

  conflictos: any[];

  resumen: {
    totalCasos: number;
    alertas: number;
    maltratos: number;
    conflictos: number;
  };

  autorizaciones: {

    pendientes:
      DashboardAutorizacionDetalle;

    rechazados:
      DashboardAutorizacionDetalle;

  };

}


@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl =
    `${environment.apiUrl}/dashboard`;


  constructor(
    private http: HttpClient
  ) {}


  getDashboard() {

    return this.http
      .get<DashboardResponse>(
        this.baseUrl
      );

  }

}
