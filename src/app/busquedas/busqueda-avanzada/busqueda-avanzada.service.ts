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
      params = params.set('fechaInicio', this.fecha(filtros.fechaInicio));
    }

    if (filtros.fechaFin) {
      params = params.set('fechaFin', this.fecha(filtros.fechaFin, true));
    }

    for (const campo of ['investigador','origenCaso']) if (filtros[campo]) params = params.set(campo, filtros[campo]);
    return this.http.get<any[]>(`${this.baseUrl}/buscar`, { params });
  }





  private fecha(valor: Date | string, fin = false): string {
    if (typeof valor === 'string') return valor;
    const fecha = new Date(valor);
    fecha.setHours(fin ? 23 : 0, fin ? 59 : 0, fin ? 59 : 0, fin ? 999 : 0);
    return fecha.toISOString();
  }
}
