import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environment.prod';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SeguimientoAlertaService {


  private baseUrl = `${environment.apiUrl}/alertas`;

  private http = inject(HttpClient);

constructor() { }

enviarSeguimientoAlerta(numeroDeic: string, data: FormData) {
  return this.http.patch(`${this.baseUrl}/seguimiento/${numeroDeic}`, data);
}

getCasoPorDeic(numeroDeic: string) {
  return this.http.get<any>(`${this.baseUrl}/by-deic/${numeroDeic}`);
}



}
