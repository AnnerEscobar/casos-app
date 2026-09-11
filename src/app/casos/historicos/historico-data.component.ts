import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { ESTADOS_EXPEDIENTE, FUENTES_HISTORICAS, UsuarioReferencia } from '../models/caso-historico.model';

@Component({
  selector: 'app-historico-data',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  styleUrl: './historicos.css',
  template: `
    <section class="historico-card" [formGroup]="form">
      <div class="historico-heading"><mat-icon>history</mat-icon><div><h2>Caso histórico</h2><p>Complete únicamente la información disponible en el expediente.</p></div></div>
      <div class="historico-grid">
        <mat-form-field appearance="outline" class="historico-full">
          <mat-label>Estado del expediente</mat-label>
          <mat-select formControlName="estadoExpedienteHistorico">
            @for (estado of estados; track estado.value) { <mat-option [value]="estado.value">{{ estado.label }}</mat-option> }
          </mat-select>
          <mat-error>Debe seleccionar el estado del expediente.</mat-error>
        </mat-form-field>
        <p class="historico-full historico-ayuda" aria-live="polite">{{ descripcionEstado }}</p>
        <mat-form-field appearance="outline"><mat-label>Fuente de información (opcional)</mat-label>
          <mat-select formControlName="fuenteInformacionHistorica"><mat-option value="">Sin indicar</mat-option>
            @for (fuente of fuentes; track fuente.value) { <mat-option [value]="fuente.value">{{ fuente.label }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Año del caso (opcional)</mat-label><input matInput type="number" min="1" max="9999" step="1" formControlName="anioCaso"><mat-error>Ingresa un año entero válido.</mat-error></mat-form-field>
        <div class="historico-full historico-grid" formGroupName="investigadorOriginal">
          <mat-form-field appearance="outline"><mat-label>Investigador original (opcional)</mat-label>
            <mat-select formControlName="usuarioId"><mat-option value="">Sin seleccionar</mat-option>
              @for (usuario of investigadores; track usuario._id) { <mat-option [value]="usuario._id">{{ usuario.nombre }}{{ usuario.activo === false ? ' (inactivo)' : '' }}</mat-option> }
            </mat-select>
            <mat-hint>{{ cargando ? 'Cargando investigadores…' : 'Puede ser distinto del responsable del seguimiento.' }}</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Nombre del investigador original (opcional)</mat-label><input matInput formControlName="nombre"><mat-hint>Si no tiene cuenta o solo conoce su nombre.</mat-hint></mat-form-field>
          <p *ngIf="errorUsuarios" class="historico-full historico-ayuda" role="status">No se pudo cargar el listado. Puede registrar únicamente el nombre conocido.</p>
        </div>
        <mat-form-field appearance="outline" class="historico-full"><mat-label>Observación histórica (opcional)</mat-label><textarea matInput rows="3" formControlName="observacionHistorica" placeholder="Describa la información disponible."></textarea></mat-form-field>
      </div>
    </section>`,
})
export class HistoricoDataComponent implements OnInit {
  @Input({ required: true }) form!: FormGroup;
  readonly estados = ESTADOS_EXPEDIENTE;
  readonly fuentes = FUENTES_HISTORICAS;
  investigadores: UsuarioReferencia[] = [];
  cargando = true;
  errorUsuarios = false;
  private usuarios = inject(UsuariosService);
  get descripcionEstado(): string { return this.estados.find(e => e.value === this.form.value.estadoExpedienteHistorico)?.detalle || 'Seleccione cómo se encuentra el expediente original.'; }
  ngOnInit(): void {
    this.usuarios.getInvestigadores().subscribe({
      next: usuarios => { this.investigadores = usuarios; this.cargando = false; },
      error: () => { this.errorUsuarios = true; this.cargando = false; },
    });
  }
}
