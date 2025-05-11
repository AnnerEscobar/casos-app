import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment.prod';

interface CaratulaPendiente {
  tipoCaso: string;
  numeroDeic: string;
  numeroMp: string;
  numeroAlerta?: string;
  nombre: string;
  lugar: string;
  observaciones: string;
  investigador: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaratulaService {

  private readonly baseUrl = `${environment.apiUrl}/caratulas`;

  constructor(private http: HttpClient) {}

  // POST /caratulas/pendiente
  crearCaratulaPendiente(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/pendiente`, data);
  }

  // GET /caratulas/pendientes
  obtenerPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pendientes`);
  }

  // DELETE /caratulas/pendiente/:numeroDeic
  eliminarPendiente(numeroDeic: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pendiente/${numeroDeic}`);
  }

  generarPDF(data: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/generar`, data, {
      responseType: 'blob'
    });
  }

  getCaratulasPendientes(page: number, limit: number): Observable<{ data: CaratulaPendiente[], total: number }> {
    return this.http.get<{ data: CaratulaPendiente[], total: number }>(
      `${this.baseUrl}/pendientes?page=${page}&limit=${limit}`
    );
  }

  deleteCaratula(numeroDeic: string) {
    return this.http.delete(`${this.baseUrl}/${numeroDeic}`);
  }

  getPendientesCount() {
    return this.http.get<{ total: number }>(`${this.baseUrl}/pendientes/count`);
  }

}
