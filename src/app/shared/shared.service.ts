
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

constructor(private http: HttpClient) { }

private baseUrl = `${environment.apiUrl}/users`;

getUserData(){
  return this.http.get<any>(`${this.baseUrl}/getUserData`);

}


}
