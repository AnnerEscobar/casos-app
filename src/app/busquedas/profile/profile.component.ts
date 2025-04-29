import { Component, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
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
  casosRelacionados: any[] = [];

  nombreReal: string = '';
  rol: string = '';
  fechaNacimiento: string = '';
  cui: string = '';
  direccion: string = '';


  constructor(
    private route: ActivatedRoute,
    private busquedaService: BusquedaService
  ) { }

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
    this.infractores = [];
    this.victimas = [];

    resultados.forEach(caso => {
      const lowerBuscado = this.nombre.toLowerCase();

      if (caso.nombreDesaparecido?.toLowerCase().includes(lowerBuscado)) {
        this.nombreReal = caso.nombreDesaparecido;
        this.rol = 'Desaparecido';
        this.fechaNacimiento = caso.fecha_Nac;
        this.direccion = caso.direccion?.direccionDetallada ?? '';
        this.cui = '';
      }

      const infractorMatch = caso.infractores?.find((i: any) =>
        i.nombre.toLowerCase().includes(lowerBuscado)
      );
      if (infractorMatch) {
        this.nombreReal = infractorMatch.nombre;
        this.rol = 'Infractor';
        this.cui = infractorMatch.cui;
        this.fechaNacimiento = infractorMatch.fecha_Nac;
        this.direccion = infractorMatch.direccion;
      }

      const victimaMatch = caso.victimas?.find((v: any) =>
        v.nombre.toLowerCase().includes(lowerBuscado)
      );
      if (victimaMatch) {
        this.nombreReal = victimaMatch.nombre;
        this.rol = 'Víctima';
        this.cui = victimaMatch.cui;
        this.fechaNacimiento = victimaMatch.fecha_Nac;
        this.direccion = victimaMatch.direccion;
      }

      if (caso.infractores) this.infractores.push(...caso.infractores);
      if (caso.victimas) this.victimas.push(...caso.victimas);
    });

    this.infractores = this.eliminarDuplicados(this.infractores, 'cui');
    this.victimas = this.eliminarDuplicados(this.victimas, 'cui');
  }


  // Método para eliminar duplicados
  eliminarDuplicados(array: any[], key: string): any[] {
    return array.filter((item, index, self) =>
      index === self.findIndex((t) => t[key] === item[key])
    );
  }


  descargarExpediente(fileUrl: string) {
    if (fileUrl) {
      // Extraer el ID del archivo de la URL
      const match = fileUrl.match(/[-\w]{25,}/); // patrón para IDs de Google Drive
      const fileId = match ? match[0] : null;

      if (fileId) {
        const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        window.open(previewUrl, '_blank'); // Abre el visor en una nueva pestaña
      } else {
        alert('No se pudo extraer el ID del archivo.');
      }
    } else {
      alert('No hay un archivo asociado a este expediente.');
    }
  }


}
