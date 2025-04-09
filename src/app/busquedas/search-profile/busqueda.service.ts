import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {

  private baseUrl = environment.apiUrl + '/busquedas'; // URL base de la API

  constructor(private http: HttpClient) {}

  // Método para buscar por nombre
  buscarPorNombre(nombre: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-nombre?nombre=${nombre}`);
  }

  // Método para buscar por CUI
  buscarPorCUI(cui: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-cui`, {
      params: { cui },
    });
  }

  buscarPorExpedienteMP(numeroMp: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-expedienteMp`, {
      params: { numeroMp },
    });
  }

  buscarPorNumeroDeic(numeroDeic: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-numero-deic`,{
      params: { numeroDeic },
    });
  }

  // Método para buscar por Alerta Alba-Keneth
  buscarPorAlertaAlbaKeneth(numeroAlerta: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/por-numero-alerta`, {
      params: { numeroAlerta },
    });
  }

  descargarExpediente(numeroMp: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/descargar-expediente/${numeroMp}`, {
      responseType: 'blob' // Indicar que la respuesta es un archivo binario
    });
  }
}

