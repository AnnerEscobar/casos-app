import { BusquedaService } from './busqueda.service';
import { ChangeDetectionStrategy, Component, NgModule, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-profile',
  imports: [
    MatCheckboxModule,
    MatExpansionModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    MatCardModule,
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    provideNativeDateAdapter()
  ],

  templateUrl: './search-profile.component.html',
  styleUrl: './search-profile.component.css'

})
export default class SearchProfileComponent {

  nombre: string = ''; // Variable para almacenar el nombre
  cui: string = ''; // Variable para almacenar el CUI
  numeroMp: string = ''; // Variable para almacenar el número de expediente MP
  numeroDeic: string = ''; // Variable para almacenar el número DEIC
  numeroAlerta: string = '';
  // Variable para almacenar el número de alerta// Variable para almacenar el número de expediente MP
  resultadosBusqueda: any[] = [];
  busquedaRealizada: boolean = false;
  isLoading: boolean = false;// Variable para almacenar los resultados de la búsqueda
  tipoBusqueda: string = '';

  constructor(private busquedaService: BusquedaService,
    private route: Router
  ) { }


  // Método para buscar por nombre
  buscarPorNombre() {
    if (!this.nombre) {
      alert('Por favor, ingresa un nombre.');
      return;
    }

    this.tipoBusqueda = 'nombre';
    this.iniciarBusqueda();

    this.busquedaService.buscarPorNombre(this.nombre).subscribe(
      (resultados) => {
        this.resultadosBusqueda = this.procesarResultadosPorNombre(this.nombre, resultados);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error al buscar por nombre:', error);
        this.isLoading = false;
        alert('No se encontraron resultados.');
      }
    );
  }



  // Método para buscar por CUI
  buscarPorCUI() {
    if (!this.cui) {
      alert('Por favor, ingresa un número de CUI.');
      return;
    }

    this.tipoBusqueda = 'cui'; // Establecer el tipo de búsqueda
    this.iniciarBusqueda();
    this.busquedaService.buscarPorCUI(this.cui).subscribe(
      (resultados) => {
        this.finalizarBusqueda(resultados);
      },
      (error) => {
        this.manejarError(error, 'CUI');
      }
    );
  }

  // Método para buscar por expediente MP
  buscarPorExpedienteMP() {
    if (!this.numeroMp) {
      alert('Por favor, ingresa un número de expediente MP.');
      return;
    }

    this.tipoBusqueda = 'numeroMp'; // Establecer el tipo de búsqueda
    this.iniciarBusqueda();
    this.busquedaService.buscarPorExpedienteMP(this.numeroMp).subscribe(
      (resultados) => {
        this.finalizarBusqueda(resultados);
      },
      (error) => {
        this.manejarError(error, 'expediente MP');
      }
    );
  }

  // Método para buscar por número DEIC
  buscarPorNumeroDeic() {
    if (!this.numeroDeic) {
      alert('Por favor, ingresa un número DEIC.');
      return;
    }

    this.tipoBusqueda = 'numeroDeic'; // Establecer el tipo de búsqueda
    this.iniciarBusqueda();
    this.busquedaService.buscarPorNumeroDeic(this.numeroDeic).subscribe(
      (resultados) => {
        this.finalizarBusqueda(resultados);
      },
      (error) => {
        this.manejarError(error, 'número DEIC');
      }
    );
  }

  // Método para buscar por Alerta Alba-Keneth
  buscarPorAlertaAlbaKeneth() {
    if (!this.numeroAlerta) {
      alert('Por favor, ingresa un número de alerta.');
      return;
    }

    this.tipoBusqueda = 'numeroAlerta'; // Establecer el tipo de búsqueda
    this.iniciarBusqueda();
    this.busquedaService.buscarPorAlertaAlbaKeneth(this.numeroAlerta).subscribe(
      (resultados) => {
        this.finalizarBusqueda(resultados);
      },
      (error) => {
        this.manejarError(error, 'Alerta Alba-Keneth');
      }
    );
  }
  // Método para iniciar la búsqueda
  iniciarBusqueda() {
    this.isLoading = true; // Mostrar el spinner
    this.busquedaRealizada = true; // Mostrar la sección de resultados
    this.resultadosBusqueda = []; // Limpiar resultados anteriores
  }

  // Método para finalizar la búsqueda
  finalizarBusqueda(resultados: any[]) {
    setTimeout(() => {
      this.isLoading = false; // Ocultar el spinner después de 3 segundos
      this.resultadosBusqueda = resultados; // Mostrar los resultados
    }, 2000); // Mostrar los resultados
  }

  // Método para manejar errores
  manejarError(error: any, tipoBusqueda: string) {
    this.isLoading = false; // Ocultar el spinner
    console.error(`Error al buscar por ${tipoBusqueda}:`, error);
    alert(`Ocurrió un error al buscar por ${tipoBusqueda}.`);
  }

  // Método para descargar el archivo asociado al expediente
  descargarArchivo(archivoUrl: string) {
    if (archivoUrl) {
      window.open(archivoUrl, '_blank'); // Abrir la URL en una nueva pestaña
    } else {
      alert('No hay un archivo asociado a este expediente.');
    }
  }

  verPerfil() {
    // Aquí puedes redirigir a la vista de perfil o abrir un modal
this.route.navigate(['/casos/profile'], {queryParams: {nombre: this.nombre}});
    // Ejemplo de redirección:
    // this.router.navigate(['/perfil', resultado._id]);
  }


  // Método para procesar los resultados de la búsqueda por nombre
  procesarResultadosPorNombre(nombreBuscado: string, resultados: any[]): any[] {
    const lowerName = nombreBuscado.trim().toLowerCase();

    return resultados.map(caso => {
      let rol = '';
      let nombreFinal = '';

      // Desaparecido
      if (caso.nombreDesaparecido?.toLowerCase().includes(lowerName)) {
        rol = 'Desaparecido';
        nombreFinal = caso.nombreDesaparecido;
      }

      // Infractores
      const infractorMatch = caso.infractores?.find((i: any) =>
        i.nombre.toLowerCase().includes(lowerName)
      );
      if (infractorMatch) {
        rol = 'Infractor';
        nombreFinal = infractorMatch.nombre;
      }

      // Víctimas
      const victimaMatch = caso.victimas?.find((v: any) =>
        v.nombre.toLowerCase().includes(lowerName)
      );
      if (victimaMatch) {
        rol = 'Víctima';
        nombreFinal = victimaMatch.nombre;
      }

      return {
        rol,
        nombre: nombreFinal,
        tipo: caso.tipo || 'Desconocido',
        numeroMp: caso.numeroMp,
        numeroDeic: caso.numeroDeic,
        estadoInvestigacion: caso.estadoInvestigacion,
        fileUrls: caso.fileUrls ?? []
      };
    });
  }




}
