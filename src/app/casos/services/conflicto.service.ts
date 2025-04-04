import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ConflictoService {

  private baseUrl = `${environment.apiUrl}/conflictos`;
  private http = inject(HttpClient);

  constructor() { }

  registrarConflicto(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/crear-conflicto`, formData);
  }

  getConflictos(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }
}
