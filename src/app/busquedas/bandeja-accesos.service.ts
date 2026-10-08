import { inject, Injectable } from '@angular/core';
import { catchError, map, merge, of, shareReplay, Subject, switchMap, timer } from 'rxjs';
import { BusquedaService } from './search-profile/busqueda.service';

export interface SolicitudBandeja {
  _id: string; casoId: string; tipo: string; numeroDeic: string; persona: string;
  solicitante?: { _id: string; nombre: string }; responsable?: { _id: string; nombre: string };
  motivo: string; fechaSolicitud: string; estado: 'PENDIENTE' | 'AUTORIZADA' | 'RECHAZADA' | 'REVOCADA';
  propia: boolean; puedeVer: boolean; puedeResolver: boolean; puedeRevocar: boolean;
}
@Injectable({ providedIn: 'root' })
export class BandejaAccesosService {
  private api = inject(BusquedaService);
  private recargar = new Subject<void>();
  // Una consulta compartida para el menú y la pantalla; se detiene al salir del sistema.
  readonly estado$ = merge(timer(0, 60000), this.recargar, this.api.cambiosAcceso$).pipe(
    switchMap(() => this.api.bandejaAccesos().pipe(
      map(solicitudes => ({ solicitudes: solicitudes as SolicitudBandeja[], error: false })),
      catchError(() => of({ solicitudes: [] as SolicitudBandeja[], error: true })),
    )), shareReplay({ bufferSize: 1, refCount: true }),
  );
  actualizar() { this.recargar.next(); }
}
