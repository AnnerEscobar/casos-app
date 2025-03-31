import { Component, HostListener } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatListModule} from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { BusquedaService } from '../search-profile/busqueda.service';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-profile',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatGridListModule,
    MatListModule,
    CommonModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export default class ProfileComponent {
  nombre: string = '';
  infractores: any[] = [];
  victimas: any[] = [];
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private busquedaService: BusquedaService
  ) {}

  ngOnInit() {
    // Obtener el nombre de los query parameters
    this.route.queryParams.subscribe(params => {
      this.nombre = params['nombre'];
      if (this.nombre) {
        this.buscarInformacionPorNombre(this.nombre);
      }
    });
  }

  // Método para buscar información por nombre
  buscarInformacionPorNombre(nombre: string) {
    this.isLoading = true;
    this.busquedaService.buscarPorNombre(nombre).subscribe(
      (resultados) => {
        this.procesarResultados(resultados);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error al buscar información:', error);
        this.isLoading = false;
      }
    );
  }

  // Método para procesar los resultados de la búsqueda
  procesarResultados(resultados: any[]) {
    this.casosRelacionados = resultados;

    // Extraer infractores y víctimas
    this.infractores = [];
    this.victimas = [];

    resultados.forEach(caso => {
      if (caso.infractores) {
        this.infractores.push(...caso.infractores);
      }
      if (caso.victimas) {
        this.victimas.push(...caso.victimas);
      }
    });

    // Filtrar duplicados (opcional)
    this.infractores = this.eliminarDuplicados(this.infractores, 'cui');
    this.victimas = this.eliminarDuplicados(this.victimas, 'cui');
  }

  // Método para eliminar duplicados
  eliminarDuplicados(array: any[], key: string): any[] {
    return array.filter((item, index, self) =>
      index === self.findIndex((t) => t[key] === item[key])
    );
  }

  casosRelacionados: any[] = [
    {
      numeroMp: '',
      fileUrl: ''
    },
    // Agrega más casos relacionados si es necesario
  ];


  descargarExpediente(fileUrl: string) {
    if (fileUrl) {
      // Abrir la URL en una nueva pestaña
      window.open(fileUrl, '_blank');
    } else {
      alert('No hay un archivo asociado a este expediente.');
    }
  }

}
