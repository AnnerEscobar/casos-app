import { Component, inject } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirmar-estado-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './confirmar-estado-dialog.component.html',
  styleUrl: './confirmar-estado-dialog.component.css'
})
export class ConfirmarEstadoDialogComponent {

  private dialogRef =
    inject(MatDialogRef<ConfirmarEstadoDialogComponent>);

  data = inject<{
    nombre: string;
    activo: boolean;
  }>(MAT_DIALOG_DATA);

  confirmar(): void {
    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
