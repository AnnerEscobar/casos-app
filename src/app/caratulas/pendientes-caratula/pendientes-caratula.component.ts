import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { CaratulaService } from '../caratula.service';

interface CaratulaPendiente {
  tipoCaso: string;
  numeroDeic: string;
  numeroMp: string;
  numeroAlerta?: string;
  nombre: string;
  lugar: string;
  observaciones: string;
  investigador: string;
}

@Component({
  selector: 'app-pendientes-caratula',
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatPaginatorModule,
    MatSortModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './pendientes-caratula.component.html',
  styleUrl: './pendientes-caratula.component.css'
})
export default class PendientesCaratulaComponent implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  pendientes   = new MatTableDataSource<CaratulaPendiente>();
  displayedColumns: string[] = ['tipoCaso', 'numeroDeic', 'nombre', 'accion'];
  totalItems   = 0;
  pageSize     = 10;
  currentPage  = 0;
  isLoading    = false;

  private router          = inject(Router);
  private caratulaService = inject(CaratulaService);
  private snackBar        = inject(MatSnackBar);

  ngOnInit()       { this.loadData(); }
  ngAfterViewInit() {
    this.pendientes.paginator = this.paginator;
    this.pendientes.sort      = this.sort;
  }

  loadData() {
    this.isLoading = true;
    this.caratulaService.getCaratulasPendientes(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.pendientes.data = response.data;
        this.totalItems      = response.total;
        this.isLoading       = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Error al cargar las carátulas pendientes.', 'Cerrar', {
          duration: 4000, panelClass: ['snack-error']
        });
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.pageSize    = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadData();
  }

  tipoClass(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('alerta')) return 'tipo-alerta';
    if (t === 'maltrato')     return 'tipo-maltrato';
    if (t === 'conflicto')    return 'tipo-conflicto';
    return '';
  }

  usarCaratula(caratula: CaratulaPendiente) {
    this.caratulaService.deleteCaratula(caratula.numeroDeic).subscribe({
      next: () => {
        const route =
          caratula.tipoCaso === 'Alerta'   ? '/casos/add-case-alerta'   :
          caratula.tipoCaso === 'Maltrato' ? '/casos/add-case-maltrato' :
                                             '/casos/add-case-conflicto';
        this.router.navigate([route], { state: caratula });
      },
      error: () => {
        this.snackBar.open('Error al procesar la carátula. Intenta nuevamente.', 'Cerrar', {
          duration: 4000, panelClass: ['snack-error']
        });
      }
    });
  }
}
