import { Component, inject, OnInit } from '@angular/core';

import { DatePipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AutorizacionesService } from '../../services/autorizaciones.service';

import {
  RegistroPendiente,
  TipoCaso
} from '../../models/registro-pendiente.model';
import { MatDialog } from '@angular/material/dialog';
import { RevisionRegistroDialogComponent } from '../../components/revision-registro-dialog/revision-registro-dialog.component';


@Component({
  selector: 'app-pendientes-autorizacion',

  standalone: true,

  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule
  ],

  templateUrl:
    './pendientes-autorizacion.component.html',

  styleUrl:
    './pendientes-autorizacion.component.css'
})
export class PendientesAutorizacionComponent



  implements OnInit {

  private autorizacionesService =
    inject(AutorizacionesService);


  registros: RegistroPendiente[] = [];

  registrosFiltrados: RegistroPendiente[] = [];

  cargando = false;

  error = '';

  filtro: 'Todos' | TipoCaso = 'Todos';


  displayedColumns: string[] = [
    'caso',
    'tipo',
    'investigador',
    'fecha',
    'estado',
    'acciones'
  ];

  private dialog = inject(MatDialog);


  ngOnInit(): void {
    this.cargarPendientes();
  }


  cargarPendientes(): void {

    this.cargando = true;

    this.error = '';


    this.autorizacionesService
      .getPendientes()
      .subscribe({

        next: (registros) => {

          this.registros = registros;

          this.aplicarFiltro();

          this.cargando = false;
        },

        error: (error) => {

          console.error(error);

          this.error =
            'No fue posible cargar los registros pendientes.';

          this.cargando = false;
        }

      });
  }


  cambiarFiltro(
    filtro: 'Todos' | TipoCaso
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
          registro.tipoCaso === this.filtro
      );
  }


  obtenerNombreRegistrador(
    registro: RegistroPendiente
  ): string {

    if (
      registro.registradoPor &&
      typeof registro.registradoPor === 'object'
    ) {

      return (
        registro.registradoPor.nombre ||
        registro.registradoPor.email ||
        'Sin nombre'
      );
    }

    return 'Sin información';
  }


revisar(
  registro: RegistroPendiente
): void {

  const dialogRef = this.dialog.open(
    RevisionRegistroDialogComponent,
    {
      width: '780px',
      maxWidth: '96vw',
      disableClose: true,
      data: registro
    }
  );


  dialogRef.afterClosed()
    .subscribe(actualizado => {

      if (actualizado) {
        this.cargarPendientes();
      }

    });
}
}