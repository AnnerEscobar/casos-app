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
    return this.http.get<any[]>(`${this.baseUrl}/por-nombre`, { params: { nombre } });
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

  detalle(tipo: string, id: string) { return this.http.get<any>(`${this.baseUrl}/expediente/${tipo}/${id}`); }
  solicitar(datos: { tipo: string; casoId: string; motivo: string }) { return this.http.post<any>(`${this.baseUrl}/solicitudes`, datos); }
  investigadores() { return this.http.get<any[]>(`${this.baseUrl}/investigadores`); }
  compartidos() { return this.http.get<any[]>(`${this.baseUrl}/compartidos`); }
  revocar(id: string) { return this.http.patch<any>(`${this.baseUrl}/solicitudes/${id}/revocar`, {}); }
  solicitudes() { return this.http.get<any[]>(`${this.baseUrl}/solicitudes`); }
  resolver(id: string, estado: 'AUTORIZADA' | 'RECHAZADA') { return this.http.patch<any>(`${this.baseUrl}/solicitudes/${id}`, { estado }); }
}

