import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import { DatePipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import {
  MatDialog
} from '@angular/material/dialog';

import {
  DetalleRegistroDialogComponent
} from '../../components/detalle-registro-dialog/detalle-registro-dialog.component';

import {
  AutorizacionesService
} from '../../services/autorizaciones.service';

import {
  RegistroPendiente
} from '../../models/registro-pendiente.model';


type FiltroEstado =
  | 'Todos'
  | 'Pendiente'
  | 'Rechazado';


@Component({
  selector: 'app-mis-registros',
  standalone: true,

  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],

  templateUrl:
    './mis-registros.component.html',

  styleUrl:
    './mis-registros.component.css'
})
export class MisRegistrosComponent
  implements OnInit {

  private autorizacionesService =
    inject(AutorizacionesService);
    private dialog = inject(MatDialog);


  registros: RegistroPendiente[] = [];

  registrosFiltrados:
    RegistroPendiente[] = [];

  filtro: FiltroEstado = 'Todos';

  cargando = false;

  error = '';


  displayedColumns = [
    'caso',
    'tipo',
    'fecha',
    'estado',
    'acciones'
  ];


  ngOnInit(): void {
    this.cargarRegistros();
  }


  cargarRegistros(): void {

    this.cargando = true;

    this.error = '';


    this.autorizacionesService
      .getMisRegistros()
      .subscribe({

        next: (registros) => {

          this.registros = registros;

          this.aplicarFiltro();

          this.cargando = false;
        },

        error: (error) => {

          console.error(error);

          this.error =
            'No fue posible cargar tus registros.';

          this.cargando = false;
        }

      });
  }


  cambiarFiltro(
    filtro: FiltroEstado
  ): void {

    this.filtro = filtro;

    this.aplicarFiltro();
  }


  private aplicarFiltro(): void {

    if (this.filtro === 'Todos') {

      this.registrosFiltrados =
        this.registros;

      return;
    }


    this.registrosFiltrados =
      this.registros.filter(
        registro =>
          registro.estadoRegistro ===
          this.filtro
      );
  }


  contar(
    estado: 'Pendiente' | 'Rechazado'
  ): number {

    return this.registros.filter(
      registro =>
        registro.estadoRegistro === estado
    ).length;
  }


 verDetalle(
  registro: RegistroPendiente
): void {

  const dialogRef =
    this.dialog.open(
      DetalleRegistroDialogComponent,
      {
        width: '760px',
        maxWidth: '96vw',
        disableClose: true,
        data: registro
      }
    );


  dialogRef.afterClosed()
    .subscribe(actualizado => {

      if (actualizado) {
        this.cargarRegistros();
      }

    });
}
}