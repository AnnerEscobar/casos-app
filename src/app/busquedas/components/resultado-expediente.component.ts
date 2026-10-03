import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { personaExpediente } from '../persona-expediente';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
    selector: 'app-resultado-expediente', imports: [CommonModule, MatButtonModule, MatIconModule], templateUrl: './resultado-expediente.component.html', styleUrl: './resultado-expediente.component.css'
})
export class ResultadoExpedienteComponent {
    @Input({ required: true })
    caso: any;
    @Input()
    institucional = false;
    @Output()
    abrir = new EventEmitter<any>();
    @Output()
    solicitar = new EventEmitter<any>();
    get restringido() {
        return this.caso.acceso === 'RESTRINGIDO';
    }
    get persona() { return personaExpediente(this.caso); }
    get pendiente() {
        return this.caso.solicitud?.estado === 'PENDIENTE';
    }
    get terminal() {
        return String(this.caso.tipo).toLowerCase().includes('alerta') ? this.caso.estadoInvestigacion === 'Concluido' : this.caso.estadoInvestigacion === 'Desestimado';
    }
}
