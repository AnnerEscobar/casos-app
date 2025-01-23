import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConflictoService {

  private baseUrl = 'http://localhost:3000/conflicto'; // Cambia la URL según tu backend
  private http = inject(HttpClient);

  constructor() { }

  sendFormData(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/new-conflicto`, formData);
  }
}
