import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertaService {

  private baseUrl = 'http://localhost:3000/alertas';
  private http = inject(HttpClient);

  constructor() { }

  registrarAlerta(formData: FormData): Observable<any>{
    return this.http.post<any>(`${this.baseUrl}/crear-alerta`, formData);
  }

  getAlertas():Observable<any[]>{
    return this.http.get<any[]>(this.baseUrl);
  }

}
