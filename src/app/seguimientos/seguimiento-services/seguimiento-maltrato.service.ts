import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SeguimientoMaltratoService {

  private apiUrl = `${environment.apiUrl}/maltratos`; // Ajusta esto

  constructor(private http: HttpClient) {}

  buscarCasoPorDeic(numeroDeic: string) {
    return this.http.get(`${this.apiUrl}/buscar/${numeroDeic}`);
  }

  enviarSeguimientoMaltrato(numeroDeic: string, data: FormData) {
    return this.http.patch(`${this.apiUrl}/seguimiento/${numeroDeic}`, data);
  }


}
