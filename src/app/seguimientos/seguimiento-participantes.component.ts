import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReferenciaUsuario, SeguimientoCaso } from '../casos/models/caso-historico.model';

@Component({
  selector: 'app-seguimiento-participantes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p *ngIf="seguimiento.investigadorAsignado">Investigador: {{ nombre(seguimiento.investigadorAsignado) }}</p>
    <small *ngIf="mostrarRegistrador">Registrado por: {{ nombre(seguimiento.registradoPor) }}</small>
  `,
  styles: [`
    :host { display: block; min-width: 0; overflow-wrap: anywhere; }
    p { margin: 6px 0 0; font-size: 13px; line-height: 1.5; }
    small { display: block; margin-top: 4px; font-size: 12px; line-height: 1.5; opacity: .8; }
  `],
})
export class SeguimientoParticipantesComponent {
  @Input({ required: true }) seguimiento!: SeguimientoCaso;
  private id(usuario?: ReferenciaUsuario): string | undefined {
    return typeof usuario === 'string' ? usuario : usuario?._id;
  }
  nombre(usuario?: ReferenciaUsuario): string {
    return typeof usuario === 'object' && usuario?.nombre ? usuario.nombre : 'Nombre no disponible';
  }
  get mostrarRegistrador(): boolean {
    return !!this.seguimiento.registradoPor && this.id(this.seguimiento.registradoPor) !== this.id(this.seguimiento.investigadorAsignado);
  }
}
