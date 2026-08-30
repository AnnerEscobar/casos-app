
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment.prod';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor(private http: HttpClient) { }

  private baseUrl = `${environment.apiUrl}/auth`;

 getUserData() {
  return this.http.get<any>(`${this.baseUrl}/session`).pipe(
    map((response) => ({
      email: response.user?.email ?? '',
      role: response.user?.role ?? ''
    }))
  );
}




}
