import { BusquedaAvanzadaService } from './busqueda-avanzada.service';
import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-busqueda-avanzada',
  imports: [
    ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatOptionModule, MatDatepickerModule,
    MatButtonModule, MatSelectModule, MatInputModule,
    MatNativeDateModule, MatTableModule, MatPaginatorModule,
    MatSortModule, CommonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './busqueda-avanzada.component.html',
  styleUrl: './busqueda-avanzada.component.css'
})
export default class BusquedaAvanzadaComponent implements AfterViewInit {

  displayedColumns: string[] = ['tipo', 'nombre', 'numeroDeic', 'estadoInvestigacion', 'numeroMp', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  isLoading = false;
  busquedaRealizada = false;
  filtroRapido = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  estados: string[] = [];

  private formBuilder = inject(FormBuilder);
  private busquedaAvanzadaService = inject(BusquedaAvanzadaService);
  private snackBar = inject(MatSnackBar);

  filtroForm = this.formBuilder.group({
    tipoCaso:    [''],
    estado:      [''],
    fechaInicio: [''],
    fechaFin:    [''],
  });

  onTipoCasoChange() {
    const tipo = this.filtroForm.value.tipoCaso;
    this.filtroForm.get('estado')?.reset();

    if (tipo === 'Maltrato') {
      this.estados = ['Informado', 'Desestimado'];
    } else if (tipo === 'Alerta Alba-Keneth') {
      this.estados = ['Informado', 'Remitido', 'Concluido'];
    } else if (tipo === 'Conflicto') {
      this.estados = ['Informado', 'Concluido'];
    } else {
      this.estados = [];
    }
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  buscarCasos() {
    const filtros = this.filtroForm.value;
    this.isLoading = true;
    this.busquedaRealizada = true;

    this.busquedaAvanzadaService.buscarCasosFiltrados(filtros).subscribe({
      next: (resultados) => {
        this.dataSource.data = resultados;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al buscar casos. Intenta nuevamente.', 'Cerrar', {
          duration: 4000, panelClass: ['snack-error']
        });
      }
    });
  }

  resetearFiltros() {
    this.filtroForm.reset();
    this.estados = [];
    this.filtroRapido = '';
    this.dataSource.data = [];
    this.dataSource.filter = '';
    this.busquedaRealizada = false;
    if (this.paginator) this.paginator.firstPage();
  }

  getNombre(row: any): string {
    return row.nombreDesaparecido
      || row.victimas?.[0]?.nombre
      || row.infractores?.[0]?.nombre
      || '—';
  }

  estadoClass(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e === 'informado')   return 'estado-informado';
    if (e === 'remitido')    return 'estado-remitido';
    if (e === 'concluido')   return 'estado-concluido';
    if (e === 'desestimado') return 'estado-desestimado';
    return '';
  }

  tipoClass(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('alerta')) return 'tipo-alerta';
    if (t === 'maltrato')     return 'tipo-maltrato';
    if (t === 'conflicto')    return 'tipo-conflicto';
    return '';
  }

  obtenerGoogleDriveId(fileUrl: string | string[]): string {
    const url = Array.isArray(fileUrl) ? fileUrl[0] : fileUrl;
    if (!url) return '';
    const match = url.match(/id=([^&]+)/);
    return match ? match[1] : '';
  }
}
