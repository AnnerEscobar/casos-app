import { BusquedaAvanzadaService } from './busqueda-avanzada.service';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-busqueda-avanzada',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatDatepickerModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    CommonModule,
    MatIconModule

  ],
  templateUrl: './busqueda-avanzada.component.html',
  styleUrl: './busqueda-avanzada.component.css'
})
export default class BusquedaAvanzadaComponent implements AfterViewInit {

  displayedColumns: string[] = ['tipo', 'nombre', 'numeroDeic', 'estadoInvestigacion', 'numeroMp', 'acciones'];

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  estados: string[] = [];
  resultados: any[] = [];

  private formBuilder = inject(FormBuilder);
  private BusquedaAvanzadaService = inject(BusquedaAvanzadaService);


  filtroForm = this.formBuilder.group({
    tipoCaso: [''],
    estado: [''],
    fechaInicio: [''],
    fechaFin: ['']
  });


  onTipoCasoChange() {
    const tipo = this.filtroForm.value.tipoCaso;

    if (tipo === 'Maltrato') {
      this.estados = ['Informado', 'Desestimado'];
    } else if (tipo === 'Alerta Alba-Keneth') {
      this.estados = ['Informado', 'Remitido', 'Concluido'];
    } else {
      this.estados = []; // Conflicto no tiene filtro por estado
      this.filtroForm.get('estado')?.reset();
    }
  }

  buscarCasos() {
    const filtros = this.filtroForm.value;
    this.BusquedaAvanzadaService.buscarCasosFiltrados(filtros).subscribe(
      (resultados) => {
        this.resultados = resultados;
        this.dataSource.data = resultados;
        console.log('Resultados de la búsqueda:', this.resultados);
      },
      (error) => {
        console.error('Error en la búsqueda:', error);
      }
    );
  }


  resetearFiltros() {
    this.filtroForm.reset(); // Limpia todos los campos del formulario
    this.estados = [];       // Vacía el array de estados por si había uno seleccionado
    this.dataSource.data = []; // Limpia la tabla de resultados

    // Si quieres también reiniciar el paginador
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }


obtenerGoogleDriveId(fileUrl: string | string[]): string {
  const url = Array.isArray(fileUrl) ? fileUrl[0] : fileUrl;
  const match = url.match(/id=([^&]+)/);
  return match ? match[1] : '';
}





}
