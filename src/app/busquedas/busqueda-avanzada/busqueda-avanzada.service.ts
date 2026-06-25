import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class BusquedaAvanzadaService {

  private baseUrl = environment.apiUrl + '/busquedas';

  constructor(
    private http: HttpClient
  ) { }


  buscarCasosFiltrados(filtros: any) {
    
    let params = new HttpParams();

    if (filtros.tipoCaso) {
      params = params.set('tipoCaso', filtros.tipoCaso);
    }

    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    if (filtros.origenAlerta) {
      params = params.set('origenAlerta', filtros.origenAlerta);
    }

    if (filtros.casaHogar) {
      params = params.set('casaHogar', filtros.casaHogar);
    }

    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<any[]>(`${this.baseUrl}/buscar`, { params });
  }





}
