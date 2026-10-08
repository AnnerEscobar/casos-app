import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BusquedaService } from '../search-profile/busqueda.service';
@Component({
    imports: [
        CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatIconModule
    ], styles: [`:host{display:block}:host ::ng-deep .mat-mdc-form-field .mdc-text-field--outlined .mdc-notched-outline__notch{border-right-width:0}mat-form-field{width:100%;margin-top:20px}h3{overflow-wrap:anywhere;margin:0 0 12px}.muted{font-size:14px;color:var(--v3-muted);line-height:1.6}.error{color:var(--v3-error);font-size:13px}`], template: `<h2 mat-dialog-title>Solicitar acceso</h2><mat-dialog-content><h3>{{ caso.numeroDeic }}</h3><p class="muted">Asignado a: {{ caso.investigador?.nombre || 'Sin investigador registrado' }}</p><p class="muted">Explica por qué necesitas consultar este expediente. La autorización permite consultarlo y no cambia su investigador.</p><mat-form-field appearance="outline"><mat-label>Motivo de la solicitud</mat-label><textarea matInput [formControl]="motivo" rows="4" maxlength="1000"></textarea><mat-hint>Mínimo 10 caracteres</mat-hint><mat-error>Escribe un motivo de entre 10 y 1000 caracteres.</mat-error></mat-form-field><p *ngIf="error" class="error" role="alert">{{ error }}</p></mat-dialog-content><mat-dialog-actions align="end"><button mat-button [disabled]="guardando" mat-dialog-close>Cancelar</button><button mat-flat-button [disabled]="guardando || motivo.invalid || motivo.value.trim().length < 10" (click)="enviar()">{{ guardando ? 'Enviando…' : 'Enviar solicitud' }}</button></mat-dialog-actions>`
})
export class SolicitarAccesoDialogComponent {
    caso = inject(MAT_DIALOG_DATA);
    ref = inject(MatDialogRef<SolicitarAccesoDialogComponent>);
    api = inject(BusquedaService);
    motivo = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(1000)] });
    guardando = false;
    error = '';
    enviar() {
        if (this.guardando || this.motivo.invalid || this.motivo.value.trim().length < 10)
            return;
        this.guardando = true;
        this.ref.disableClose = true;
        this.error = '';
        this.api.solicitar({
            tipo: String(this.caso.tipo).toLowerCase().includes('alerta') ? 'alerta' : this.caso.tipo.toLowerCase(), casoId: this.caso._id, motivo: this.motivo.value.trim()
        }).subscribe({ next: s => this.ref.close(s), error: e => {
                this.guardando = false;
                this.ref.disableClose = false;
                this.error = e.error?.message || 'No se pudo enviar. Intenta nuevamente.';
            } });
    }
}
