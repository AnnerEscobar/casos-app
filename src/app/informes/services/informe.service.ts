import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class InformeService {

  private baseUrl = `${environment.apiUrl}/informes`;
  private http = inject(HttpClient);

  crear(data: { numeroDeic: string; numeroMp: string; tipoInforme: string }): Observable<any> {
    return this.http.post<any>(this.baseUrl, data);
  }

  obtenerPorDeic(numeroDeic: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${numeroDeic}`);
  }

  obtenerTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  obtenerPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pendientes`);
  }

  actualizarSeccion(numeroDeic: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${numeroDeic}/seccion`, data);
  }

  marcarPendienteRegistro(numeroDeic: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${numeroDeic}/pendiente-registro`, {});
  }

  registrarConPdf(numeroDeic: string, formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${numeroDeic}/registrar`, formData);
  }

  agregarAmpliacion(numeroDeic: string, formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${numeroDeic}/ampliacion`, formData);
  }

  eliminar(numeroDeic: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${numeroDeic}`);
  }

descargarWord(numeroDeic: string): void {
  this.http.get(`${this.baseUrl}/${numeroDeic}/descargar-word`, {
    responseType: 'blob'
  }).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `INFORME-${numeroDeic}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: () => console.error('Error al descargar el Word')
  });
}
}
