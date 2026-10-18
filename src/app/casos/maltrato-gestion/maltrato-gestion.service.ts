import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment.prod';

@Injectable({providedIn:'root'})
export class MaltratoGestionService {
  private http=inject(HttpClient);
  private url=`${environment.apiUrl}/maltratos`;
  listar(){return this.http.get<any[]>(`${this.url}/gestion`);}
  detalle(id:string){return this.http.get<any>(`${this.url}/gestion/${id}`);}
  registrar(datos:any){return this.http.post<any>(`${this.url}/registro-inicial`,datos);}
  guardar(id:string,datos:any){return this.http.patch<any>(`${this.url}/gestion/${id}`,datos);}
  entregar(id:string,file:File){const data=new FormData();data.append('file',file);return this.http.post<any>(`${this.url}/gestion/${id}/entregar`,data);}
  exportar(){return this.http.get(`${this.url}/exportar-excel`,{responseType:'blob'});}
}
