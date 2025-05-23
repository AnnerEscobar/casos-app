import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
  imports: [MatTableModule, MatCardModule, MatButtonModule, MatPaginatorModule],
  templateUrl: './pendientes-caratula.component.html',
  styleUrl: './pendientes-caratula.component.css'
})


export default class PendientesCaratulaComponent {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.pendientes.paginator = this.paginator;
  }


  constructor(private router: Router, private caratulaService: CaratulaService) { }

  pendientes: MatTableDataSource<CaratulaPendiente> = new MatTableDataSource();
  displayedColumns: string[] = ['tipoCaso', 'numeroDeic', 'nombre', 'accion'];
  totalItems = 0;
  pageSize = 6;
  currentPage = 0;


  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.caratulaService.getCaratulasPendientes(this.currentPage, this.pageSize)
      .subscribe((response) => {
        this.pendientes.data = response.data;
        this.totalItems = response.total;
      });
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadData();
  }

  usarCaratula(caratula: CaratulaPendiente) {
    this.caratulaService.deleteCaratula(caratula.numeroDeic).subscribe({
      next: () => {

        // Navega según el tipo de caso
        const route =
          caratula.tipoCaso === 'Alerta' ? '/casos/add-case-alerta' :
            caratula.tipoCaso === 'Maltrato' ? '/casos/add-case-maltrato' :
              '/casos/add-case-conflicto';

        this.router.navigate([route], { state: caratula });
      },
      error: (err) => {
        console.error('Error al eliminar la carátula', err);
      }
    });
  }


}
