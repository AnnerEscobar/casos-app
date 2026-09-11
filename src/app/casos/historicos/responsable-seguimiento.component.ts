import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { UsuarioReferencia } from '../models/caso-historico.model';

@Component({
  selector: 'app-responsable-seguimiento', imports: [CommonModule, ReactiveFormsModule, MatSelectModule, MatFormFieldModule, MatButtonModule], styleUrl: './historicos.css',
  template: `<div class="historico-card">
    <h2>Investigador responsable del seguimiento</h2>
    <p>Seleccione a quien tiene asignado este seguimiento. No modifica al investigador original.</p>
    <mat-form-field appearance="outline"><mat-label>Investigador asignado</mat-label>
      <mat-select [formControl]="control"><mat-option value="">Seleccione un investigador</mat-option>
        @for (usuario of investigadores; track usuario._id) { <mat-option [value]="usuario._id">{{ usuario.nombre }}</mat-option> }
      </mat-select>
      <mat-hint *ngIf="cargando">Cargando investigadores…</mat-hint>
      <mat-error>Seleccione el investigador responsable.</mat-error>
    </mat-form-field>
    @if (error) { <p role="alert">No se pudo cargar el listado de investigadores.</p><button mat-stroked-button type="button" (click)="cargar()" [disabled]="cargando">Reintentar</button> }
  </div>`,
})
export class ResponsableSeguimientoComponent implements OnInit {
  @Input({ required: true }) control!: FormControl;
  investigadores: UsuarioReferencia[] = [];
  cargando = false;
  error = false;
  private usuarios = inject(UsuariosService);
  ngOnInit(): void { this.cargar(); }
  cargar(): void {
    this.cargando = true; this.error = false;
    this.usuarios.getInvestigadores().subscribe({
      next: usuarios => { this.investigadores = usuarios.filter(u => u.activo !== false); this.cargando = false; },
      error: () => { this.error = true; this.cargando = false; },
    });
  }
}
