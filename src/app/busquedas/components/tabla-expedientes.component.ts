import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { personaExpediente } from '../persona-expediente';

@Component({
  selector: 'app-tabla-expedientes',
  imports: [CommonModule, MatTableModule, MatButtonModule],
  template: `
    <div class="table-scroll" tabindex="0" role="region" aria-label="Listado de expedientes">
      <table mat-table [dataSource]="casos">
        <ng-container matColumnDef="numero">
          <th mat-header-cell *matHeaderCellDef>Expediente</th>
          <td mat-cell *matCellDef="let c"><button mat-button (click)="abrir.emit(c)" [attr.aria-label]="'Abrir expediente completo ' + c.numeroDeic">{{ c.numeroDeic }}</button><small>MP {{ c.numeroMp || 'No registrado' }}</small><small *ngIf="c.numeroAlerta">Alerta {{ c.numeroAlerta }}</small></td>
        </ng-container>
        <ng-container matColumnDef="persona">
          <th mat-header-cell *matHeaderCellDef>Persona</th>
          <td mat-cell *matCellDef="let c"><small>{{ persona(c).etiqueta }}</small>{{ persona(c).nombre }}</td>
        </ng-container>
        <ng-container matColumnDef="tipo">
          <th mat-header-cell *matHeaderCellDef>Tipo / origen</th>
          <td mat-cell *matCellDef="let c">{{ c.tipo | titlecase }}<small>{{ c.origenCaso === 'HISTORICO' ? 'Histórico' : 'Sistema' }}</small></td>
        </ng-container>
        <ng-container matColumnDef="investigador">
          <th mat-header-cell *matHeaderCellDef>Investigador</th>
          <td mat-cell *matCellDef="let c">{{ c.investigador?.nombre || 'Sin investigador registrado' }}</td>
        </ng-container>
        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado / acceso</th>
          <td mat-cell *matCellDef="let c">{{ c.estadoInvestigacion || 'No registrado' }}<small *ngIf="c.acceso === 'AUTORIZADO'">Acceso autorizado</small><small *ngIf="c.acceso === 'SEGUIMIENTO_ASIGNADO'">Seguimiento asignado</small></td>
        </ng-container>
        <ng-container matColumnDef="fecha">
          <th mat-header-cell *matHeaderCellDef>Último movimiento</th>
          <td mat-cell *matCellDef="let c">{{ c.ultimoMovimiento ? (c.ultimoMovimiento | date:'dd/MM/yyyy HH:mm') : 'Sin fecha' }}<small>{{ c.cantidadSeguimientos || 0 }} seguimientos</small></td>
        </ng-container>
        <ng-container matColumnDef="acciones" stickyEnd>
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let c"><button mat-button (click)="abrir.emit(c)" [attr.aria-label]="'Ver expediente ' + c.numeroDeic">Ver expediente</button></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let row; columns: columnas"></tr>
      </table>
    </div>`,
  styles: [`:host{display:block;min-width:0}.table-scroll{width:100%;overflow-x:auto;border:1px solid #e2e8f0;border-radius:12px}.table-scroll:focus-visible{outline:2px solid #2563eb;outline-offset:2px}table{width:100%;min-width:960px}th{white-space:nowrap}td,th{padding:12px 16px}td{max-width:300px;overflow-wrap:anywhere}small{display:block;color:#64748b;margin-top:4px}button{white-space:nowrap}`],
})
export class TablaExpedientesComponent {
  @Input() casos: any[] = [];
  @Output() abrir = new EventEmitter<any>();
  columnas = ['numero', 'persona', 'tipo', 'investigador', 'estado', 'fecha', 'acciones'];
  persona = personaExpediente;
}
