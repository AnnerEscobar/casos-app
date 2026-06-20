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
  casoPerfil: any | null = null;
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
    this.casoPerfil = null;
  }

  ejecutarBusqueda() {
    if (!this.termino?.trim()) return;

    this.isLoading = true;
    this.busquedaRealizada = true;
    this.resultadosBusqueda = [];
    this.casoPerfil = null;
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
        if (this.esBusquedaDeCaso) {
          this.casoPerfil = resultados?.[0] ? this.normalizarPerfilCaso(resultados[0]) : null;
          this.resultadosBusqueda = [];
        } else {
          this.resultadosBusqueda = this.procesarResultadosPersona(t, resultados);
        }
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

  get esBusquedaDeCaso(): boolean {
    return ['numeroMp', 'numeroDeic', 'numeroAlerta'].includes(this.tipoBusqueda);
  }

  get totalDocumentosCaso(): number {
    if (!this.casoPerfil) return 0;
    return this.casoPerfil.documentos.length + this.casoPerfil.seguimientos.reduce((total: number, seg: any) => total + seg.archivos.length, 0);
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

  procesarResultadosPersona(terminoBuscado: string, resultados: any[]): any[] {
    const lowerTerm = terminoBuscado.trim().toLowerCase();
    return resultados
      .map(caso => {
        let rol = '', nombreFinal = '', cui = '', fechaNacimiento = '', direccion = '';

        const alertaCoincidePorNombre = caso.nombreDesaparecido?.toLowerCase().includes(lowerTerm);
        const alertaCoincidePorCui = this.tipoBusqueda === 'cui' && false;

        if (alertaCoincidePorNombre || alertaCoincidePorCui) {
          rol            = 'Desaparecido';
          nombreFinal    = caso.nombreDesaparecido;
          fechaNacimiento = caso.fecha_Nac || '';
          direccion      = caso.direccion?.direccionDetallada || '';
        }

        const infractorMatch = caso.infractores?.find((i: any) =>
          this.coincidePersona(i, lowerTerm)
        );
        if (infractorMatch) {
          rol             = 'Infractor';
          nombreFinal     = infractorMatch.nombre;
          cui             = infractorMatch.cui || '';
          fechaNacimiento = infractorMatch.fecha_Nac || '';
          direccion       = infractorMatch.direccion || '';
        }

        const victimaMatch = caso.victimas?.find((v: any) =>
          this.coincidePersona(v, lowerTerm)
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

  private coincidePersona(persona: any, termino: string): boolean {
    if (!persona) return false;
    const nombre = String(persona.nombre || '').toLowerCase();
    const cui = String(persona.cui || persona.dpi || persona.documentoIdentificacion || '').toLowerCase();
    return nombre.includes(termino) || cui.includes(termino);
  }

  private normalizarPerfilCaso(caso: any): any {
    const tipo = caso.tipo || 'Desconocido';
    const esAlerta = tipo.toLowerCase().includes('alerta');
    const involucrados = esAlerta
      ? [{
          rol: 'Desaparecido',
          nombre: caso.nombreDesaparecido,
          cui: '',
          fechaNacimiento: caso.fecha_Nac,
          direccion: this.formatearDireccion(caso.direccion),
        }]
      : [
          ...(caso.victimas || []).map((p: any) => ({ ...p, rol: 'Victima', fechaNacimiento: p.fecha_Nac })),
          ...(caso.infractores || []).map((p: any) => ({ ...p, rol: tipo === 'Conflicto' ? 'Adolescente en conflicto' : 'Sindicado/Infractor', fechaNacimiento: p.fecha_Nac })),
        ];

    return {
      ...caso,
      tipo,
      involucrados: involucrados.filter((p: any) => p?.nombre),
      documentos: (caso.fileUrls || []).map((url: string, index: number) => ({
        nombre: index === 0 ? 'Expediente principal' : `Documento ${index + 1}`,
        url,
      })),
      seguimientos: (caso.seguimientos || []).map((seg: any, index: number) => ({
        ...seg,
        titulo: `Seguimiento ${index + 1}`,
        estado: seg.estado || seg.nuevoEstado || caso.estadoInvestigacion,
        archivos: (seg.archivos || []).map((url: string, i: number) => ({
          nombre: `Documento ${i + 1}`,
          url,
        })),
      })),
      direccionTexto: this.formatearDireccion(caso.direccion),
    };
  }

  formatearDireccion(direccion: any): string {
    if (!direccion) return '';
    if (typeof direccion === 'string') return direccion;
    return [direccion.direccionDetallada, direccion.municipio, direccion.departamento].filter(Boolean).join(', ');
  }

  abrirSeguimiento(caso: any) {
    const tipo = caso?.tipo?.toLowerCase() || '';
    if (tipo.includes('alerta')) {
      this.router.navigate(['/casos/seguimiento-alerta'], { state: { numeroDeic: caso.numeroDeic } });
    } else if (tipo.includes('maltrato')) {
      this.router.navigate(['/casos/seguimiento-maltrato'], { state: { numeroDeic: caso.numeroDeic } });
    } else if (tipo.includes('conflicto')) {
      this.router.navigate(['/casos/seguimiento-conflicto'], { state: { numeroDeic: caso.numeroDeic } });
    }
  }
}
