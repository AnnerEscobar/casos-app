import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = `${environment.apiUrl}/busquedas`;

constructor(
  private http: HttpClient
) { }

getEstadisticasMensuales() {
  return this.http.get<any[]>(`${this.baseUrl}/estadisticas-mensuales`);
}


}
