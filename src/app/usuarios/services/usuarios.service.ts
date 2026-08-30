import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environment.prod';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/users`);
  }

  //crear usuario
  crearUsuario(data: {
    nombre: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  //actualizar usuario
  actualizarUsuario(
    id: string,
    data: {
      nombre?: string;
      role?: string;
    }
  ) {
    return this.http.patch(
      `${this.apiUrl}/users/${id}`,
      data
    );
  }


  actualizarEstadoUsuario(
  id: string,
  activo: boolean
) {
  return this.http.patch(
    `${this.apiUrl}/users/${id}/status`,
    { activo }
  );
}

}
