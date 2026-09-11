import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import AddCaseAlertaComponent from '../pages/add-case-alerta/add-case-alerta.component';
import AddCaseMaltratoComponent from '../pages/add-case-maltrato/add-case-maltrato.component';
import AddCaseConflictoComponent from '../pages/add-case-conflicto/add-case-conflicto.component';
import { CasoSeguimiento, TipoCaso } from '../models/caso-historico.model';

export interface IncorporarHistoricoData { tipo: TipoCaso; numeroDeic: string }
@Component({
  selector: 'app-incorporar-historico-dialog',
  imports: [MatDialogModule, MatButtonModule, AddCaseAlertaComponent, AddCaseMaltratoComponent, AddCaseConflictoComponent],
  styles: [`:host { display: block; min-width: 0; } mat-dialog-content { max-height: 75dvh; padding: 0 20px 12px !important; } @media (max-width: 600px) { mat-dialog-content { padding: 0 12px 12px !important; } }`],
  template: `<h2 mat-dialog-title>Incorporar caso histórico</h2>
    <mat-dialog-content>
      @switch (data.tipo) {
        @case ('alerta') { <app-add-case-alerta [modoHistorico]="true" [numeroDeicInicial]="data.numeroDeic" (historicoCreado)="continuar($event)" (ocupacionCambio)="ocupacion($event)" /> }
        @case ('maltrato') { <app-add-case-maltrato [modoHistorico]="true" [numeroDeicInicial]="data.numeroDeic" (historicoCreado)="continuar($event)" (ocupacionCambio)="ocupacion($event)" /> }
        @case ('conflicto') { <app-add-case-conflicto [modoHistorico]="true" [numeroDeicInicial]="data.numeroDeic" (historicoCreado)="continuar($event)" (ocupacionCambio)="ocupacion($event)" /> }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-stroked-button type="button" [disabled]="guardando" (click)="ref.close()">Cancelar</button></mat-dialog-actions>`,
})
export class IncorporarHistoricoDialogComponent {
  readonly data = inject<IncorporarHistoricoData>(MAT_DIALOG_DATA);
  readonly ref = inject<MatDialogRef<IncorporarHistoricoDialogComponent, CasoSeguimiento>>(MatDialogRef);
  guardando = false;
  ocupacion(valor: boolean): void { this.guardando = valor; this.ref.disableClose = valor; }
  continuar(caso: CasoSeguimiento): void { this.ref.close(caso); }
}
