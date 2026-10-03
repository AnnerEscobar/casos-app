import { Component, inject, ViewChild } from '@angular/core';
import { TablaExpedientesComponent } from '../components/tabla-expedientes.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth-service/auth.service';
import { ExpedienteDialogComponent } from '../components/expediente-dialog.component';
import { SolicitarAccesoDialogComponent } from '../components/solicitar-acceso-dialog.component';
import { SolicitudesAccesoComponent } from '../components/solicitudes-acceso.component';
import { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule, MatDatepickerIntl } from '@angular/material/datepicker';
import { MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { BusquedaAvanzadaService } from './busqueda-avanzada.service';
import { BusquedaService } from '../search-profile/busqueda.service';
@Component({
    providers: [
      { provide: MAT_DATE_LOCALE, useValue: 'es-GT' },
      { provide: MatDatepickerIntl, useFactory: () => { const i = new MatDatepickerIntl(); i.openCalendarLabel = 'Abrir calendario'; i.prevMonthLabel = 'Mes anterior'; i.nextMonthLabel = 'Mes siguiente'; return i; } },
      { provide: MatPaginatorIntl, useFactory: () => {
          const i = new MatPaginatorIntl(); i.itemsPerPageLabel = 'Expedientes por página'; i.nextPageLabel = 'Página siguiente'; i.previousPageLabel = 'Página anterior';
          i.getRangeLabel = (page, size, length) => length ? (page * size + 1) + '–' + Math.min((page + 1) * size, length) + ' de ' + length : '0 expedientes';
          return i;
      } },
    ],
    selector: 'app-busqueda-avanzada', imports: [
        CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatProgressSpinnerModule, MatNativeDateModule, MatDatepickerModule, MatPaginatorModule, RouterLink, TablaExpedientesComponent, SolicitudesAccesoComponent
    ], templateUrl: './busqueda-avanzada.component.html', styleUrl: './busqueda-avanzada.component.css'
})
export default class BusquedaAvanzadaComponent implements OnInit {
    private fb = inject(FormBuilder);
    private api = inject(BusquedaAvanzadaService);
    private acceso = inject(BusquedaService);
    private dialog = inject(MatDialog);
    private auth = inject(AuthService);
    @ViewChild(SolicitudesAccesoComponent)
    solicitudes?: SolicitudesAccesoComponent;
    filtroForm = this.fb.group({
        tipoCaso: [''], estado: [''], origenAlerta: [''], casaHogar: [''], fechaInicio: [null as Date | null], fechaFin: [null as Date | null], investigador: [''], origenCaso: ['']
    });
    resultados: any[] = [];
    investigadores: any[] = [];
    isLoading = false;
    busquedaRealizada = false;
    error = '';
    filtroRapido = '';
    avanzados = false;
    pagina = 0;
    tamano = 10;
    origenesAlerta = ['Casa hogar', 'Constatacion PGN', 'Desaparicion del hogar', 'Otro'];
    casasHogar = [
        'Diamante I', 'Diamante II', 'Diamante III', 'Diamante IV', 'Diamante V', 'Zafiro I', 'Zafiro II', 'Zafiro III', 'Zafiro IV', 'Zafiro V'
    ];
    get institucional() {
        return ['Analista', 'Jefe', 'Administrador'].includes(this.auth.getCurrentUser()?.role || '');
    }
    ngOnInit() {
        if (this.institucional)
            this.acceso.investigadores().subscribe({ next: r => this.investigadores = r, error: () => this.error = 'No se pudo cargar el listado de investigadores. Puedes usar los otros filtros.' });
    }
    get estados() {
        const t = this.filtroForm.value.tipoCaso;
        return t === 'Alerta Alba-Keneth' ? ['Informado', 'Remitido', 'Concluido'] : t ? ['Informado', 'Desestimado'] : ['Informado', 'Remitido', 'Concluido', 'Desestimado'];
    }
    get filtrados() {
        const t = this.filtroRapido.trim().toLowerCase();
        return this.resultados.filter(c => [
            c.numeroDeic, c.numeroMp, c.numeroAlerta, c.tipo, c.investigador?.nombre, c.estadoInvestigacion, c.nombreDesaparecido, ...(c.victimas || []).map((p: any) => p.nombre), ...(c.infractores || []).map((p: any) => p.nombre)
        ].some(v => String(v || '').toLowerCase().includes(t)));
    }
    get visibles() {
        return this.filtrados.slice(this.pagina * this.tamano, (this.pagina + 1) * this.tamano);
    }
    onTipoCasoChange() {
        this.filtroForm.patchValue({
            estado: '', origenAlerta: '', casaHogar: ''
        });
    }
    cambiarPagina(e: PageEvent) {
        this.pagina = e.pageIndex;
        this.tamano = e.pageSize;
    }
    buscarCasos() {
        if (this.isLoading)
            return;
        this.error = '';
        const f = this.filtroForm.value;
        if (this.filtroForm.invalid) {
            this.error = 'Revisa las fechas ingresadas.';
            return;
        }
        if (f.fechaInicio && f.fechaFin && f.fechaInicio > f.fechaFin) {
            this.error = 'La fecha inicial debe ser anterior o igual a la fecha final.';
            return;
        }
        this.isLoading = true;
        this.api.buscarCasosFiltrados({ ...f, ...(!this.institucional ? { investigador: '', origenCaso: '' } : {}) }).subscribe({ next: r => {
                this.resultados = r;
                this.pagina = 0;
                this.isLoading = false;
                this.busquedaRealizada = true;
            }, error: () => {
                this.isLoading = false;
                this.error = 'No se pudo completar la búsqueda. Intenta nuevamente.';
            } });
    }
    resetearFiltros() {
        if (this.isLoading)
            return;
        this.filtroForm.reset();
        this.resultados = [];
        this.filtroRapido = '';
        this.pagina = 0;
        this.busquedaRealizada = false;
        this.error = '';
    }
    abrir(c: any) {
        this.dialog.open(ExpedienteDialogComponent, {
            data: c, width: '960px', maxWidth: 'calc(100vw - 24px)', maxHeight: '92dvh'
        });
    }
    solicitar(c: any) {
        this.dialog.open(SolicitarAccesoDialogComponent, {
            data: c, width: '540px', maxWidth: 'calc(100vw - 24px)'
        }).afterClosed().subscribe(s => {
            if (s) {
                c.solicitud = s;
                this.solicitudes?.cargar();
            }
        });
    }
}
