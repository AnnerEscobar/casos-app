import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import { Observable } from 'rxjs';

import {
  CrearDocumentacionInicial,
  DocumentacionInicial,
  GuardarPlan,
  GuardarRubrica,
  PendientesResponse,
  PlanInvestigacionResponse,
  RubricaResponse,
} from '../models/documentacion-inicial.model';
import { environment } from '../../../environment.prod';



@Injectable({
  providedIn: 'root',
})
export class DocumentacionInicialService {
  paraCaso(tipo: string, casoId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/para-caso/${encodeURIComponent(tipo)}/${encodeURIComponent(casoId)}`, { withCredentials: true });
  }

  descargarPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob', withCredentials: true });
  }

  private readonly apiUrl =
    `${environment.apiUrl}/documentacion-inicial`;


  constructor(
    private readonly http: HttpClient,
  ) {}


  /* ======================================================
     CREAR DOCUMENTACIÓN / PASO 1
  ====================================================== */

  crear(
    data: CrearDocumentacionInicial,
  ): Observable<DocumentacionInicial> {

    return this.http.post<DocumentacionInicial>(
      this.apiUrl,
      data,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     ACTUALIZAR CARÁTULA
  ====================================================== */

  actualizarCaratula(
    id: string,
    data: Partial<CrearDocumentacionInicial>,
  ): Observable<DocumentacionInicial> {

    return this.http.patch<DocumentacionInicial>(
      `${this.apiUrl}/${id}/caratula`,
      data,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     OBTENER PLAN DE INVESTIGACIÓN
  ====================================================== */

  obtenerPlan(
    id: string,
  ): Observable<PlanInvestigacionResponse> {

    return this.http.get<PlanInvestigacionResponse>(
      `${this.apiUrl}/${id}/plan`,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     GUARDAR PLAN DE INVESTIGACIÓN
  ====================================================== */

  guardarPlan(
    id: string,
    data: GuardarPlan,
  ): Observable<DocumentacionInicial> {

    return this.http.patch<DocumentacionInicial>(
      `${this.apiUrl}/${id}/plan`,
      data,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     OBTENER RÚBRICA
  ====================================================== */

  obtenerRubrica(
    id: string,
  ): Observable<RubricaResponse> {

    return this.http.get<RubricaResponse>(
      `${this.apiUrl}/${id}/rubrica`,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     GUARDAR RÚBRICA
  ====================================================== */

  guardarRubrica(
    id: string,
    data: GuardarRubrica,
  ): Observable<DocumentacionInicial> {

    return this.http.patch<DocumentacionInicial>(
      `${this.apiUrl}/${id}/rubrica`,
      data,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     OBTENER UNA DOCUMENTACIÓN
  ====================================================== */

  obtenerUno(
    id: string,
  ): Observable<DocumentacionInicial> {

    return this.http.get<DocumentacionInicial>(
      `${this.apiUrl}/${id}`,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     MIS DOCUMENTOS
  ====================================================== */

  misDocumentos():
    Observable<DocumentacionInicial[]> {

    return this.http.get<DocumentacionInicial[]>(
      `${this.apiUrl}/mis-documentos`,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     PENDIENTES
  ====================================================== */

  pendientes(
    page = 1,
    limit = 10,
  ): Observable<PendientesResponse> {

    const params =
      new HttpParams()
        .set(
          'page',
          page.toString(),
        )
        .set(
          'limit',
          limit.toString(),
        );


    return this.http.get<PendientesResponse>(
      `${this.apiUrl}/pendientes`,
      {
        params,
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     HISTORIAL
  ====================================================== */

  historial():
    Observable<DocumentacionInicial[]> {

    return this.http.get<DocumentacionInicial[]>(
      `${this.apiUrl}/historial`,
      {
        withCredentials: true,
      },
    );
  }


  /* ======================================================
     ELIMINAR BORRADOR
  ====================================================== */

  eliminarBorrador(
    id: string,
  ): Observable<{
    message: string;
  }> {

    return this.http.delete<{
      message: string;
    }>(
      `${this.apiUrl}/${id}`,
      {
        withCredentials: true,
      },
    );
  }
}
