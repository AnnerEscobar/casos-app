import { AuthService } from '../../auth/auth-service/auth.service';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { BusquedaService } from '../search-profile/busqueda.service';
@Component({
    imports: [
        CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
    ], templateUrl: './expediente-dialog.component.html', styleUrl: './expediente-dialog.component.css'
})
export class ExpedienteDialogComponent implements OnInit {
    data = inject(MAT_DIALOG_DATA);
    ref = inject(MatDialogRef<ExpedienteDialogComponent>);
    api = inject(BusquedaService);
    router = inject(Router);
    auth = inject(AuthService);
    get puedeSeguimiento() {
        return this.auth.getCurrentUser()?.role === 'Analista' || ['PROPIO', 'SEGUIMIENTO_ASIGNADO'].includes(this.caso?.acceso);
    }
    caso: any = null;
    error = '';
    loading = true;
    get tipo() {
        return String(this.data.tipo).toLowerCase().includes('alerta') ? 'alerta' : this.data.tipo.toLowerCase();
    }
    ngOnInit() {
        this.api.detalle(this.tipo, this.data._id).subscribe({ next: c => {
                this.caso = c;
                this.loading = false;
            }, error: e => {
                this.loading = false;
                this.error = e.status === 403 ? 'Se requiere autorización para consultar este expediente.' : 'No se pudo cargar el expediente. Cierra e intenta nuevamente.';
            } });
    }
    get personas(): any[] {
        return this.caso ? [...(this.caso.nombreDesaparecido ? [{
                    nombre: this.caso.nombreDesaparecido, fecha_Nac: this.caso.fecha_Nac, rol: 'Desaparecido'
                }] : []), ...(this.caso.victimas || []).map((p: any) => ({ ...p, rol: 'Víctima' })), ...(this.caso.infractores || []).map((p: any) => ({ ...p, rol: this.tipo === 'conflicto' ? 'Adolescente en conflicto' : 'Sindicado' }))] : [];
    }
    direccion(v: any): string {
        return typeof v === 'string' ? v : [v?.direccionDetallada, v?.municipio, v?.departamento].filter(Boolean).join(', ');
    }
    verArchivo(url: string): string {
        try {
            const archivo = new URL(url);
            if (archivo.hostname === 'drive.google.com') {
                const id = archivo.searchParams.get('id') || archivo.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1];
                if (id && /^[\w-]+$/.test(id)) return `https://drive.google.com/file/d/${id}/view`;
            }
        } catch { /* Los enlaces heredados conservan el tratamiento seguro de Angular. */ }
        return url;
    }
    perfil(p: any) {
        this.ref.close();
        this.router.navigate(['/casos/profile'], { state: { persona: {
                    ...this.caso, ...p, fechaNacimiento: p.fecha_Nac
                } } });
    }
    seguimiento() {
        this.ref.close();
        this.router.navigate(['/casos/seguimiento-' + this.tipo], { state: { numeroDeic: this.caso.numeroDeic } });
    }
}
