import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BusquedaService } from '../search-profile/busqueda.service';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export default class ProfileComponent implements OnInit {

  persona: any = null;
  casosRelacionados: any[] = [];
  isLoading = false;

  private router          = inject(Router);
  private busquedaService = inject(BusquedaService);
  private snackBar        = inject(MatSnackBar);

  ngOnInit() {
    const state = history.state;
    if (state?.persona) {
      this.persona = state.persona;
      this.buscarCasosRelacionados(this.persona.nombre);
    } else {
      this.router.navigate(['/busquedas']);
    }
  }

  private buscarCasosRelacionados(nombre: string) {
    this.isLoading = true;
    this.busquedaService.buscarPorNombre(nombre).subscribe({
      next: (resultados) => {
        this.casosRelacionados = this.filtrarEstricto(nombre, resultados);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  // Requiere que al menos 2 palabras significativas (>2 chars) coincidan,
  // evitando que un apellido común como "Cruz" traiga decenas de personas distintas.
  private filtrarEstricto(nombreExacto: string, resultados: any[]): any[] {
    const palabras = nombreExacto.toLowerCase().trim()
      .split(/\s+/).filter(p => p.length > 2);
    const requerido = Math.min(2, palabras.length);

    const checar = (n: string) => {
      if (!n) return false;
      const nl = n.toLowerCase();
      return palabras.filter(p => nl.includes(p)).length >= requerido;
    };

    return resultados
      .filter(caso =>
        checar(caso.nombreDesaparecido)
        || caso.infractores?.some((i: any) => checar(i.nombre))
        || caso.victimas?.some((v: any) => checar(v.nombre))
      )
      .map(caso => ({
        tipo:                caso.tipo,
        numeroMp:            caso.numeroMp,
        numeroDeic:          caso.numeroDeic,
        estadoInvestigacion: caso.estadoInvestigacion,
        fileUrls:            caso.fileUrls ?? [],
      }));
  }

  rolClass(rol: string): string {
    const r = (rol || '').toLowerCase();
    if (r === 'desaparecido') return 'rol-desaparecido';
    if (r === 'víctima')      return 'rol-victima';
    if (r === 'infractor')    return 'rol-infractor';
    return '';
  }

  tipoClass(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('alerta')) return 'tipo-alerta';
    if (t === 'maltrato')     return 'tipo-maltrato';
    if (t === 'conflicto')    return 'tipo-conflicto';
    return '';
  }

  estadoClass(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e === 'informado')   return 'estado-informado';
    if (e === 'remitido')    return 'estado-remitido';
    if (e === 'concluido')   return 'estado-concluido';
    if (e === 'desestimado') return 'estado-desestimado';
    return '';
  }

  descargarArchivo(url: string) {
    if (url) {
      window.open(url, '_blank');
    } else {
      this.snackBar.open('No hay archivo asociado a este expediente.', 'Cerrar', {
        duration: 3000, panelClass: ['snack-warning']
      });
    }
  }

  volver() { history.back(); }
}
