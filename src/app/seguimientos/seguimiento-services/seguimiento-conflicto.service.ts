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
    return this.http.get(`${this.apiUrl}/buscar/${numeroDeic}`);
  }

  enviarSeguimientoConflicto(numeroDeic: string, data: FormData) {
    return this.http.patch(`${this.apiUrl}/seguimiento/${numeroDeic}`, data);
  }

}
