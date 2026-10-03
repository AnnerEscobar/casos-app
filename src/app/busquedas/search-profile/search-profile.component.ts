import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth-service/auth.service';
import { ResultadoExpedienteComponent } from '../components/resultado-expediente.component';
import { ExpedienteDialogComponent } from '../components/expediente-dialog.component';
import { SolicitarAccesoDialogComponent } from '../components/solicitar-acceso-dialog.component';
import { SolicitudesAccesoComponent } from '../components/solicitudes-acceso.component';
import { BusquedaService } from './busqueda.service';
@Component({
    selector: 'app-search-profile', imports: [
        CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatProgressSpinnerModule, RouterLink, ResultadoExpedienteComponent, SolicitudesAccesoComponent
    ], templateUrl: './search-profile.component.html', styleUrl: './search-profile.component.css'
})
export default class SearchProfileComponent {
    private api = inject(BusquedaService);
    private dialog = inject(MatDialog);
    private auth = inject(AuthService);
    @ViewChild(SolicitudesAccesoComponent)
    solicitudes?: SolicitudesAccesoComponent;
    tipoBusqueda = 'numeroDeic';
    termino = '';
    resultadosBusqueda: any[] = [];
    busquedaRealizada = false;
    isLoading = false;
    error = '';
    ultimaConsulta = '';
    searchTypes = [
        {
            key: 'numeroDeic', label: 'Número DEIC', placeholder: 'DEIC51-2026-08-21-831', hint: 'Ingresa el número completo del expediente.'
        },
        {
            key: 'numeroMp', label: 'Expediente MP', placeholder: 'M0030-2026-2469', hint: 'Ingresa el número completo del Ministerio Público.'
        },
        {
            key: 'numeroAlerta', label: 'Número de Alerta', placeholder: '2664-2026', hint: 'Ingresa el número y año de la alerta.'
        },
        {
            key: 'nombre', label: 'Nombre', placeholder: 'Nombre o apellido', hint: 'Puedes utilizar el nombre completo o una parte.'
        },
        {
            key: 'cui', label: 'CUI / DPI', placeholder: '2345678901234', hint: 'Ingresa el documento de identificación.'
        }
    ];
    get tipoActivo() {
        return this.searchTypes.find(t => t.key === this.tipoBusqueda)!;
    }
    get institucional() {
        return ['Analista', 'Jefe', 'Administrador'].includes(this.auth.getCurrentUser()?.role || '');
    }
    get exacta() {
        return ['numeroDeic', 'numeroMp', 'numeroAlerta'].includes(this.tipoBusqueda);
    }
    seleccionarTipo(tipo: string) {
        if (this.isLoading)
            return;
        this.tipoBusqueda = tipo;
        this.termino = '';
        this.error = '';
        this.busquedaRealizada = false;
        this.resultadosBusqueda = [];
    }
    ejecutarBusqueda() {
        if (this.isLoading || !this.termino.trim())
            return;
        const termino = this.termino.trim();
        const tipo = this.tipoBusqueda;
        const llamadas: Record<string, () => any> = {
            numeroDeic: () => this.api.buscarPorNumeroDeic(termino), numeroMp: () => this.api.buscarPorExpedienteMP(termino), numeroAlerta: () => this.api.buscarPorAlertaAlbaKeneth(termino), nombre: () => this.api.buscarPorNombre(termino), cui: () => this.api.buscarPorCUI(termino)
        };
        if (!llamadas[tipo])
            return;
        this.isLoading = true;
        this.error = '';
        llamadas[tipo]().subscribe({ next: (r: any[]) => {
                this.resultadosBusqueda = r;
                this.busquedaRealizada = true;
                this.isLoading = false;
                this.ultimaConsulta = termino;
            }, error: (e: any) => {
                this.isLoading = false;
                this.error = e.status === 403 ? 'No tienes permisos para realizar esta consulta.' : 'No se pudo completar la búsqueda. Intenta nuevamente.';
            } });
    }
    abrir(caso: any) {
        this.dialog.open(ExpedienteDialogComponent, {
            data: caso, width: '960px', maxWidth: 'calc(100vw - 24px)', maxHeight: '92dvh'
        });
    }
    solicitar(caso: any) {
        this.dialog.open(SolicitarAccesoDialogComponent, {
            data: caso, width: '540px', maxWidth: 'calc(100vw - 24px)'
        }).afterClosed().subscribe(s => {
            if (s) {
                caso.solicitud = s;
                this.solicitudes?.cargar();
            }
        });
    }
}
