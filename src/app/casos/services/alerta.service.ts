import { historicoFormData } from '../historicos/historico-formulario';
import { CasoSeguimiento, CrearHistorico } from '../models/caso-historico.model';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AlertaService {

  private baseUrl = `${environment.apiUrl}/alertas`;

  private http = inject(HttpClient);

  crearHistorico(datos: CrearHistorico, file?: File | null): Observable<CasoSeguimiento> {
    return this.http.post<CasoSeguimiento>(`${this.baseUrl}/historico`, file ? historicoFormData(datos, file) : datos);
  }

  constructor() { }

  registrarAlerta(formData: FormData): Observable<any>{
    return this.http.post<any>(`${this.baseUrl}/crear-alerta`, formData);
  }

  getAlertas():Observable<any[]>{
    return this.http.get<any[]>(this.baseUrl);
  }

}
