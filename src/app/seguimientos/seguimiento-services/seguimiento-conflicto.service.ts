import { CasoSeguimiento, RespuestaSeguimiento } from '../../casos/models/caso-historico.model';
import { normalizarNumeroCaso } from '../../casos/historicos/historico-formulario';
import { Injectable } from '@angular/core';
import { environment } from '../../../environment.prod';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SeguimientoConflictoService {

  private apiUrl = `${environment.apiUrl}/conflictos`; // Ajusta esto

  constructor(private http: HttpClient) {}

  buscarCasoConflictoPorDeic(numeroDeic: string) {
    return this.http.get<CasoSeguimiento>(`${this.apiUrl}/buscar/${encodeURIComponent(normalizarNumeroCaso(numeroDeic))}`);
  }

  enviarSeguimientoConflicto(numeroDeic: string, data: FormData) {
    return this.http.patch<RespuestaSeguimiento>(`${this.apiUrl}/seguimiento/${encodeURIComponent(normalizarNumeroCaso(numeroDeic))}`, data);
  }

}
