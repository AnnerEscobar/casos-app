import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-carga-archivo',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './carga-archivo.component.html',
  styleUrl: './carga-archivo.component.css',
})
export class CargaArchivoComponent {
  @Input() archivos: readonly File[] = [];
  @Input() multiple = false;
  @Input() accept = 'application/pdf,.pdf';
  @Input() formatos = 'Únicamente se permiten documentos PDF';
  @Input() titulo = 'Selecciona el PDF del expediente';
  @Input() disabled = false;
  @Output() seleccion = new EventEmitter<Event>();

  seleccionar(event: Event): void {
    this.seleccion.emit(event);
    // Permite volver a seleccionar el mismo archivo tras retirarlo o rechazarlo.
    (event.target as HTMLInputElement).value = '';
  }

  get nombres(): string {
    return this.archivos.map(archivo => archivo.name).join(', ');
  }
}
