import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../environment.prod';

import {
  RegistroPendiente,
  TipoCaso
} from '../models/registro-pendiente.model';


@Injectable({
  providedIn: 'root'
})
export class AutorizacionesService {

  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;


  getPendientes(): Observable<RegistroPendiente[]> {

    return forkJoin({

      maltratos:
        this.http.get<any[]>(
          `${this.apiUrl}/maltratos/pendientes-autorizacion`
        ),

      alertas:
        this.http.get<any[]>(
          `${this.apiUrl}/alertas/pendientes-autorizacion`
        ),

      conflictos:
        this.http.get<any[]>(
          `${this.apiUrl}/conflictos/pendientes-autorizacion`
        )

    }).pipe(

      map((response) => {

        const registros: RegistroPendiente[] = [

          ...this.normalizar(
            response.maltratos,
            'Maltrato'
          ),

          ...this.normalizar(
            response.alertas,
            'Alerta'
          ),

          ...this.normalizar(
            response.conflictos,
            'Conflicto'
          )

        ];


        return registros.sort((a, b) => {

          const fechaA =
            new Date(a.createdAt ?? 0).getTime();

          const fechaB =
            new Date(b.createdAt ?? 0).getTime();

          return fechaB - fechaA;

        });

      })
    );
  }


  private normalizar(
    casos: any[],
    tipoCaso: TipoCaso
  ): RegistroPendiente[] {

    return casos.map((caso) => ({

      _id: caso._id,

      numeroDeic: caso.numeroDeic,

      numeroMp: caso.numeroMp,

      estadoRegistro:
        caso.estadoRegistro,

      registradoPor:
        caso.registradoPor,

      createdAt:
        caso.createdAt,

      fechaRevision:
        caso.fechaRevision,

      tipoCaso,

      caso

    }));
  }


  aprobarRegistro(
  registro: RegistroPendiente
): Observable<any> {

  const endpoint = this.obtenerEndpoint(
    registro.tipoCaso
  );

  return this.http.patch(
    `${this.apiUrl}/${endpoint}/${registro._id}/aprobar-registro`,
    {}
  );
}


rechazarRegistro(
  registro: RegistroPendiente,
  motivo: string
): Observable<any> {

  const endpoint = this.obtenerEndpoint(
    registro.tipoCaso
  );

  return this.http.patch(
    `${this.apiUrl}/${endpoint}/${registro._id}/rechazar-registro`,
    {
      motivo
    }
  );
}


private obtenerEndpoint(
  tipoCaso: TipoCaso
): string {

  switch (tipoCaso) {

    case 'Maltrato':
      return 'maltratos';

    case 'Alerta':
      return 'alertas';

    case 'Conflicto':
      return 'conflictos';

    default:
      throw new Error(
        'Tipo de caso no reconocido'
      );
  }
}

getMisRegistros(): Observable<RegistroPendiente[]> {

  return forkJoin({

    maltratos:
      this.http.get<any[]>(
        `${this.apiUrl}/maltratos/mis-registros`
      ),

    alertas:
      this.http.get<any[]>(
        `${this.apiUrl}/alertas/mis-registros`
      ),

    conflictos:
      this.http.get<any[]>(
        `${this.apiUrl}/conflictos/mis-registros`
      )

  }).pipe(

    map((response) => {

      const registros: RegistroPendiente[] = [

        ...this.normalizar(
          response.maltratos,
          'Maltrato'
        ),

        ...this.normalizar(
          response.alertas,
          'Alerta'
        ),

        ...this.normalizar(
          response.conflictos,
          'Conflicto'
        )

      ];

      const pendientes = registros
        .filter(registro => registro.estadoRegistro !== 'Aprobado')
        .sort((a, b) => this.fechaOrden(b.createdAt) - this.fechaOrden(a.createdAt));

      // El límite es compartido por los tres tipos de expediente.
      const aprobados = registros
        .filter(registro => registro.estadoRegistro === 'Aprobado')
        .sort((a, b) =>
          this.fechaOrden(b.fechaRevision) - this.fechaOrden(a.fechaRevision) ||
          this.fechaOrden(b.createdAt) - this.fechaOrden(a.createdAt) ||
          b._id.localeCompare(a._id)
        )
        .slice(0, 10);

      return [...pendientes, ...aprobados];

    })
  );
}

private fechaOrden(fecha?: string): number {
  const valor = new Date(fecha ?? 0).getTime();
  return Number.isFinite(valor) ? valor : 0;
}

reenviarRegistro(
  registro: RegistroPendiente,
  file: File
): Observable<any> {

  const endpoint = this.obtenerEndpoint(
    registro.tipoCaso
  );

  const formData = new FormData();

  formData.append('file', file);

  return this.http.patch(
    `${this.apiUrl}/${endpoint}/${registro._id}/reenviar-registro`,
    formData
  );
}


}
