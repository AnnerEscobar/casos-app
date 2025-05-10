import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment.prod';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CaratulaService {

    private baseUrl = `${environment.apiUrl}/alertas`;
    private http = inject(HttpClient);

  constructor() { }


generarPDF(data: any): Observable<Blob> {
  return this.http.post(`${this.baseUrl}/caratulas/generar`, data, {
    responseType: 'blob'
  });
}

}
