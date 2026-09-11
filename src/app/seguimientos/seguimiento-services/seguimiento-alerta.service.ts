import { CasoSeguimiento, RespuestaSeguimiento } from '../../casos/models/caso-historico.model';
import { normalizarNumeroCaso } from '../../casos/historicos/historico-formulario';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment.prod';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SeguimientoAlertaService {


  private baseUrl = `${environment.apiUrl}/alertas`;

  private http = inject(HttpClient);

constructor() { }

enviarSeguimientoAlerta(numeroDeic: string, data: FormData) {
  return this.http.patch<RespuestaSeguimiento>(`${this.baseUrl}/seguimiento/${encodeURIComponent(normalizarNumeroCaso(numeroDeic))}`, data);
}

getCasoPorDeic(numeroDeic: string) {
  return this.http.get<CasoSeguimiento>(`${this.baseUrl}/by-deic/${encodeURIComponent(normalizarNumeroCaso(numeroDeic))}`);
}



}
