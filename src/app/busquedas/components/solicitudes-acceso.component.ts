import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../auth/auth-service/auth.service';
import { BusquedaService } from '../search-profile/busqueda.service';
@Component({
    selector: 'app-solicitudes-acceso', imports: [CommonModule, MatButtonModule, MatIconModule], templateUrl: './solicitudes-acceso.component.html', styleUrls: ['../busquedas-v3.css', './solicitudes-acceso.component.css']
})
export class SolicitudesAccesoComponent implements OnInit {
    @Output()
    cambio = new EventEmitter<void>();
    api = inject(BusquedaService);
    auth = inject(AuthService);
    solicitudes: any[] = [];
    cargando = false;
    procesando = '';
    error = '';
    @Input() expandido = false;
    confirmarRevocacion = '';
    puedeRevocar(s: any) {
        return s.estado === 'AUTORIZADA' && (['Analista', 'Jefe', 'Administrador'].includes(this.usuario?.role || '') || s.responsable?._id === this.usuario?.userId || s.solicitante?._id === this.usuario?.userId);
    }
    revocar(s: any) {
        if (this.procesando || !this.puedeRevocar(s)) return;
        this.procesando = s._id;
        this.error = '';
        this.api.revocar(s._id).subscribe({ next: () => {
            this.procesando = '';
            this.confirmarRevocacion = '';
            this.cargar();
            this.cambio.emit();
        }, error: e => {
            this.procesando = '';
            this.error = e.error?.message || 'No se pudo revocar el permiso.';
        } });
    }
    get usuario() {
        return this.auth.getCurrentUser();
    }
    ngOnInit() {
        this.cargar();
    }
    cargar() {
        if (this.cargando)
            return;
        this.cargando = true;
        this.error = '';
        this.api.solicitudes().subscribe({ next: s => {
                this.solicitudes = s;
                this.cargando = false;
            }, error: () => {
                this.cargando = false;
                this.error = 'No se pudieron cargar las solicitudes.';
            } });
    }
    puedeResolver(s: any) {
        return s.estado === 'PENDIENTE' && s.solicitante?._id !== this.usuario?.userId && (['Analista', 'Jefe', 'Administrador'].includes(this.usuario?.role || '') || s.responsable?._id === this.usuario?.userId);
    }
    resolver(s: any, estado: 'AUTORIZADA' | 'RECHAZADA') {
        if (this.procesando)
            return;
        this.procesando = s._id;
        this.error = '';
        this.api.resolver(s._id, estado).subscribe({ next: () => {
                this.procesando = '';
                this.cargar();
                this.cambio.emit();
            }, error: e => {
                this.procesando = '';
                this.error = e.error?.message || 'No se pudo resolver la solicitud.';
            } });
    }
    get pendientes() {
        return this.solicitudes.filter(s => s.estado === 'PENDIENTE').length;
    }
}
