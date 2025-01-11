import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertaService {

  private baseUrl = 'Api'
  private http = inject(HttpClient);

  constructor() { }

  registrarAlerta(formData: FormData): Observable<any>{
    return this.http.post<any>(this.baseUrl, formData);
  }



}
