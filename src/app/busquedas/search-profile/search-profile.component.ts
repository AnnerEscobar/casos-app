import { BusquedaService } from './busqueda.service';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-profile',
  imports: [
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, CommonModule, FormsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './search-profile.component.html',
  styleUrl: './search-profile.component.css'
})
export default class SearchProfileComponent {

  tipoBusqueda = '';
  termino = '';
  resultadosBusqueda: any[] = [];
  busquedaRealizada = false;
  isLoading = false;

  searchTypes = [
    { key: 'nombre',       label: 'Nombre',             icon: 'person_search',          placeholder: 'Ej. Juan Pérez',        hint: 'Busca por nombre completo o parcial' },
    { key: 'cui',          label: 'CUI / DPI',           icon: 'badge',                  placeholder: 'Ej. 2345678901234',     hint: 'Número de CUI o DPI del individuo' },
    { key: 'numeroMp',     label: 'Expediente MP',       icon: 'article',                placeholder: 'M0030-2025-100',        hint: 'Número de caso del Ministerio Público' },
    { key: 'numeroDeic',   label: 'Número DEIC',         icon: 'folder_shared',          placeholder: 'DEIC52-2025-01-02-01', hint: 'Número de expediente DEIC' },
    { key: 'numeroAlerta', label: 'Alerta Alba-Keneth',  icon: 'notification_important', placeholder: 'Ej. 2664-2025',         hint: 'Número de alerta registrada' },
  ];

  get tipoActivo() {
    return this.searchTypes.find(t => t.key === this.tipoBusqueda);
  }

  constructor(
    private busquedaService: BusquedaService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  seleccionarTipo(tipo: string) {
    this.tipoBusqueda = tipo;
    this.termino = '';
    this.busquedaRealizada = false;
    this.resultadosBusqueda = [];
  }

  ejecutarBusqueda() {
    if (!this.termino?.trim()) return;

    this.isLoading = true;
    this.busquedaRealizada = true;
    this.resultadosBusqueda = [];
    const t = this.termino.trim();

    const obs$ = (() => {
      switch (this.tipoBusqueda) {
        case 'nombre':       return this.busquedaService.buscarPorNombre(t);
        case 'cui':          return this.busquedaService.buscarPorCUI(t);
        case 'numeroMp':     return this.busquedaService.buscarPorExpedienteMP(t);
        case 'numeroDeic':   return this.busquedaService.buscarPorNumeroDeic(t);
        case 'numeroAlerta': return this.busquedaService.buscarPorAlertaAlbaKeneth(t);
        default:             return null;
      }
    })();

    if (!obs$) { this.isLoading = false; return; }

    obs$.subscribe({
      next: (resultados) => {
        this.resultadosBusqueda = this.tipoBusqueda === 'nombre'
          ? this.procesarResultadosPorNombre(t, resultados)
          : resultados;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('No se encontraron resultados para esa búsqueda.', 'Cerrar', {
          duration: 4000, panelClass: ['snack-error']
        });
      }
    });
  }

  verPerfil(resultado: any) {
    this.router.navigate(['/casos/profile'], { state: { persona: resultado } });
  }

  descargarArchivo(archivoUrl: string) {
    if (archivoUrl) {
      window.open(archivoUrl, '_blank');
    } else {
      this.snackBar.open('No hay un archivo asociado a este expediente.', 'Cerrar', {
        duration: 3000, panelClass: ['snack-warning']
      });
    }
  }

  getNombre(r: any): string {
    return r.nombre || r.nombreDesaparecido
      || r.victimas?.[0]?.nombre
      || r.infractores?.[0]?.nombre
      || '';
  }

  tipoClass(tipo: string): string {
    if (!tipo) return '';
    const t = tipo.toLowerCase();
    if (t.includes('alerta')) return 'tipo-alerta';
    if (t === 'maltrato')     return 'tipo-maltrato';
    if (t === 'conflicto')    return 'tipo-conflicto';
    return '';
  }

  estadoClass(estado: string): string {
    if (!estado) return '';
    const e = estado.toLowerCase();
    if (e === 'informado')   return 'estado-informado';
    if (e === 'remitido')    return 'estado-remitido';
    if (e === 'concluido')   return 'estado-concluido';
    if (e === 'desestimado') return 'estado-desestimado';
    return '';
  }

  procesarResultadosPorNombre(nombreBuscado: string, resultados: any[]): any[] {
    const lowerName = nombreBuscado.trim().toLowerCase();
    return resultados
      .map(caso => {
        let rol = '', nombreFinal = '', cui = '', fechaNacimiento = '', direccion = '';

        if (caso.nombreDesaparecido?.toLowerCase().includes(lowerName)) {
          rol            = 'Desaparecido';
          nombreFinal    = caso.nombreDesaparecido;
          fechaNacimiento = caso.fecha_Nac || '';
          direccion      = caso.direccion?.direccionDetallada || '';
        }

        const infractorMatch = caso.infractores?.find((i: any) =>
          i.nombre.toLowerCase().includes(lowerName)
        );
        if (infractorMatch) {
          rol             = 'Infractor';
          nombreFinal     = infractorMatch.nombre;
          cui             = infractorMatch.cui || '';
          fechaNacimiento = infractorMatch.fecha_Nac || '';
          direccion       = infractorMatch.direccion || '';
        }

        const victimaMatch = caso.victimas?.find((v: any) =>
          v.nombre.toLowerCase().includes(lowerName)
        );
        if (victimaMatch) {
          rol             = 'Víctima';
          nombreFinal     = victimaMatch.nombre;
          cui             = victimaMatch.cui || '';
          fechaNacimiento = victimaMatch.fecha_Nac || '';
          direccion       = victimaMatch.direccion || '';
        }

        if (!rol) return null;

        return {
          rol,
          nombre:               nombreFinal,
          tipo:                 caso.tipo || 'Desconocido',
          numeroMp:             caso.numeroMp,
          numeroDeic:           caso.numeroDeic,
          estadoInvestigacion:  caso.estadoInvestigacion,
          fileUrls:             caso.fileUrls ?? [],
          cui,
          fechaNacimiento,
          direccion,
        };
      })
      .filter(Boolean);
  }
}
