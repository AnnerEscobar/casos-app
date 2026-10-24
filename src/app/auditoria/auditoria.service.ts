import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment.prod';

export interface EventoAuditoria {
  eventoId: string;
  solicitudId: string;
  fecha: string;
  usuario: {
    id: string;
    nombre: string;
    rol: string
  };
  accion: string;
  resultado: string;
  recurso: string;
  recursoId?: string;
  numeroDeic?: string;
  casoId?: string;
  metodo: string;
  ruta: string;
  ip: string;
  agente: string;
  codigoHttp?: number;
  integridadValida: boolean;
  sesion?: {
    id: string;
    inicio: string;
    fin?: string;
    ultimaActividad?: string;
    duracionSegundos?: number;
    motivo?: string
  };
  cambios: {
    campo: string;
    anterior: unknown;
    nuevo: unknown
  }[];
}

export interface PaginaAuditoria { registros: EventoAuditoria[]; total: number; pagina: number; limite: number; }
@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);
  buscar(filtros: Record<string, string>, pagina: number) {
    let params = new HttpParams().set('pagina', pagina).set('limite', 25);
    for (const [key, value] of Object.entries(filtros)) if (value.trim()) params = params.set(key, value.trim());
    return this.http.get<PaginaAuditoria>(`${environment.apiUrl}/auditoria`, { params, withCredentials: true });
  }
}
