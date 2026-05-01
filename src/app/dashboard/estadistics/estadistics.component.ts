import { ConflictoService } from './../../casos/services/conflicto.service';
import { AlertaService } from './../../casos/services/alerta.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MaltratoService } from '../../casos/services/maltrato.service';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { finalize, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from './dashboard.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

type YearOption = number | 'all';

const C = {
  alerta:      '#1976D2',
  maltrato:    '#D81B60',
  conflicto:   '#7E57C2',
  informado:   '#42A5F5',
  concluido:   '#43A047',
  remitido:    '#FFB300',
  desestimado: '#EF5350',
  victimas:    '#EF9A9A',
  infractores: '#CE93D8',
  grid:        '#ECEFF4',
};

@Component({
  selector: 'app-estadistics',
  imports: [
    MatCardModule, MatGridListModule, NgApexchartsModule, CommonModule,
    MatProgressSpinnerModule, MatIconModule, MatSelectModule,
    MatOptionModule, FormsModule, MatFormFieldModule
  ],
  templateUrl: './estadistics.component.html',
  styleUrl: './estadistics.component.css',
})
export default class EstadisticsComponent implements OnInit {

  isLoading = false;

  @ViewChild('barChart')      barChart!:      ChartComponent;
  @ViewChild('stackedChart')  stackedChart!:  ChartComponent;
  @ViewChild('radialChart')   radialChart!:   ChartComponent;
  @ViewChild('hBarChart')     hBarChart!:     ChartComponent;
  @ViewChild('areaChart')     areaChart!:     ChartComponent;
  @ViewChild('donutChart')    donutChart!:    ChartComponent;
  @ViewChild('forecastChart') forecastChart!: ChartComponent;

  currentYear = new Date().getFullYear();
  selectedYear: YearOption = 'all';
  yearsDisponibles: YearOption[] = ['all'];

  exps: Array<{
    key: 'alerta' | 'maltrato' | 'conflicto' | 'remitidas' | 'activas' | 'inactivas';
    tag: string; amount: number; icon: string;
  }> = [
    { key: 'alerta',     tag: 'Alerta Alba-Keneth',   amount: 0, icon: 'notifications_active' },
    { key: 'maltrato',   tag: 'Casos de Maltrato',    amount: 0, icon: 'volunteer_activism'   },
    { key: 'conflicto',  tag: 'Casos de Conflicto',   amount: 0, icon: 'gavel'                },
    { key: 'remitidas',  tag: 'Alertas Remitidas',    amount: 0, icon: 'outgoing_mail'        },
    { key: 'activas',    tag: 'Alertas Activas',      amount: 0, icon: 'task_alt'             },
    { key: 'inactivas',  tag: 'Alertas Inactivas',    amount: 0, icon: 'remove_circle'        },
  ];

  // ── Chart options (typed as any for flexibility) ──────────────────────────
  barChartOptions:      any;
  donutChartOptions:    any;
  stackedChartOptions:  any;
  areaChartOptions:     any;
  radialChartOptions:   any;
  hBarChartOptions:     any;
  forecastChartOptions: any;

  constructor(
    private alertaService:   AlertaService,
    private maltratoService: MaltratoService,
    private conflictoService: ConflictoService,
    private dashboardService: DashboardService,
  ) { this.initCharts(); }

  ngOnInit(): void { this.cargarDatos(); }

  // ── Inicialización base de cada gráfico ──────────────────────────────────
  private initCharts() {
    const baseBar = {
      chart: { type: 'bar', height: 300, toolbar: { show: false }, redrawOnParentResize: true },
      plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 5, borderRadiusApplication: 'end' } },
      dataLabels: { enabled: false },
      grid: { borderColor: C.grid, strokeDashArray: 2 },
      tooltip: { y: { formatter: (v: number) => `${v} casos` } },
    };

    // 1. Barras totales por tipo
    this.barChartOptions = {
      ...baseBar,
      series: [{ name: 'Casos', data: [0, 0, 0] }],
      colors: [C.alerta, C.maltrato, C.conflicto],
      plotOptions: { bar: { distributed: true, horizontal: false, columnWidth: '45%', borderRadius: 6, borderRadiusApplication: 'end', dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (v: number) => `${v}`, offsetY: -14, style: { fontSize: '12px', colors: ['#555'] } },
      xaxis: { categories: ['Alertas', 'Maltratos', 'Conflictos'] },
      yaxis: { min: 0, tickAmount: 5 },
      legend: { show: false },
      title: { text: 'Total por tipo de caso', style: { fontSize: '13px', fontWeight: '600' } },
    };

    // 2. Donut distribución alertas
    this.donutChartOptions = {
      series: [0, 0, 0],
      chart: { type: 'donut', height: 300, redrawOnParentResize: true },
      labels: ['Activas', 'Concluidas', 'Remitidas'],
      colors: [C.informado, C.concluido, C.remitido],
      stroke: { colors: ['#fff'] },
      dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(0)}%` },
      plotOptions: { pie: { donut: { size: '62%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '14px', fontWeight: '700' } } } } },
      legend: { position: 'bottom' },
      responsive: [],
      title: { text: 'Distribución de Alertas', style: { fontSize: '13px', fontWeight: '600' } },
    };

    // 3. Stacked bar — estado por tipo
    this.stackedChartOptions = {
      ...baseBar,
      series: [
        { name: 'Informado',   data: [0, 0, 0] },
        { name: 'Concluido',   data: [0, 0, 0] },
        { name: 'Remitido',    data: [0, 0, 0] },
        { name: 'Desestimado', data: [0, 0, 0] },
      ],
      chart: { type: 'bar', height: 300, stacked: true, toolbar: { show: false }, redrawOnParentResize: true },
      colors: [C.informado, C.concluido, C.remitido, C.desestimado],
      xaxis: { categories: ['Alertas', 'Maltratos', 'Conflictos'] },
      yaxis: { min: 0, tickAmount: 5 },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
      fill: { opacity: 1 },
      title: { text: 'Estado de investigación por tipo', style: { fontSize: '13px', fontWeight: '600' } },
    };

    // 4. Area mensual
    this.areaChartOptions = {
      series: [
        { name: 'Alerta',    data: new Array(12).fill(0) },
        { name: 'Maltrato',  data: new Array(12).fill(0) },
        { name: 'Conflicto', data: new Array(12).fill(0) },
      ],
      chart: { type: 'area', height: 300, toolbar: { show: false }, redrawOnParentResize: true },
      colors: [C.alerta, C.maltrato, C.conflicto],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
      xaxis: { categories: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'] },
      yaxis: { min: 0, tickAmount: 5 },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
      grid: { borderColor: C.grid, strokeDashArray: 2 },
      title: { text: 'Tendencia mensual de casos', style: { fontSize: '13px', fontWeight: '600' } },
      tooltip: { y: { formatter: (v: number) => `${v} casos` } },
    };

    // 5. Radial bar — tasa de resolución
    this.radialChartOptions = {
      series: [0, 0, 0],
      chart: { type: 'radialBar', height: 300, redrawOnParentResize: true },
      labels: ['Alertas', 'Maltratos', 'Conflictos'],
      colors: [C.alerta, C.maltrato, C.conflicto],
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: { size: '25%', background: 'transparent' },
          track: { background: '#f0f0f0', strokeWidth: '97%', margin: 4 },
          dataLabels: {
            name: { fontSize: '12px', offsetY: -10 },
            value: { fontSize: '15px', fontWeight: 700, formatter: (v: number) => `${v.toFixed(0)}%` },
            total: { show: true, label: 'Promedio', fontSize: '12px',
              formatter: (w: any) => {
                const s = w.globals.series as number[];
                const avg = s.length ? Math.round(s.reduce((a: number, b: number) => a + b, 0) / s.length) : 0;
                return `${avg}%`;
              }
            }
          }
        }
      },
      legend: { show: true, position: 'bottom', horizontalAlign: 'center', fontSize: '12px' },
      title: { text: 'Tasa de resolución', style: { fontSize: '13px', fontWeight: '600' } },
    };

    // 6. Forecast — proyección próximos 2 meses
    this.forecastChartOptions = {
      series: [
        { name: 'Alerta',    data: new Array(14).fill(0) },
        { name: 'Maltrato',  data: new Array(14).fill(0) },
        { name: 'Conflicto', data: new Array(14).fill(0) },
      ],
      chart: {
        type: 'line',
        height: 320,
        toolbar: { show: false },
        redrawOnParentResize: true,
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
      },
      forecastDataPoints: { count: 2, fillOpacity: 0.5, strokeWidth: 2, dashArray: 6 },
      colors: [C.alerta, C.maltrato, C.conflicto],
      stroke: { curve: 'smooth', width: [2, 2, 2], dashArray: [0, 0, 0] },
      markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
      fill: { type: 'solid', opacity: 1 },
      xaxis: { categories: [], tooltip: { enabled: false } },
      yaxis: { min: 0, tickAmount: 5, labels: { formatter: (v: number) => Math.round(v).toString() } },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
      grid: { borderColor: C.grid, strokeDashArray: 2 },
      title: { text: 'Proyección de casos — próximos 2 meses', style: { fontSize: '13px', fontWeight: '600' } },
      tooltip: { shared: true, y: { formatter: (v: number, opts: any) => {
        const idx = opts?.dataPointIndex;
        const total = (opts?.w?.globals?.series as number[][])?.reduce((sum, s) => sum + (s[idx] ?? 0), 0);
        return `${Math.round(v)} casos (total ${Math.round(total)})`;
      }}},
      annotations: {
        xaxis: [{
          x: '',   // se llena dinámicamente
          borderColor: '#999',
          borderWidth: 1,
          strokeDashArray: 4,
          label: { text: 'Hoy', style: { color: '#fff', background: '#999', fontSize: '11px' } }
        }]
      }
    };

    // 7. Horizontal bar — personas involucradas
    this.hBarChartOptions = {
      series: [
        { name: 'Víctimas',              data: [0, 0, 0] },
        { name: 'Sindicados/Infractores', data: [0, 0, 0] },
      ],
      chart: { type: 'bar', height: 300, toolbar: { show: false }, redrawOnParentResize: true },
      colors: [C.victimas, C.infractores],
      plotOptions: { bar: { horizontal: true, borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, offsetX: 20, style: { fontSize: '11px', colors: ['#555'] } },
      xaxis: { categories: ['Alertas', 'Maltratos', 'Conflictos'] },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px' },
      grid: { borderColor: C.grid, strokeDashArray: 2 },
      title: { text: 'Personas involucradas por tipo', style: { fontSize: '13px', fontWeight: '600' } },
      tooltip: { y: { formatter: (v: number) => `${v} personas` } },
    };
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
  cargarDatos(): void {
    this.isLoading = true;
    forkJoin({
      alertas:   this.alertaService.getAlertas(),
      maltratos: this.maltratoService.getMaltratos(),
      conflictos: this.conflictoService.getConflictos(),
    }).pipe(finalize(() => this.isLoading = false))
    .subscribe(({ alertas, maltratos, conflictos }) => {

      // Años disponibles
      const allYears = new Set<number>();
      [...alertas, ...maltratos, ...conflictos].forEach(i => {
        const y = this.getYear(i);
        if (y !== null) allYears.add(y);
      });
      this.yearsDisponibles = ['all', ...Array.from(allYears).sort((a, b) => b - a)];

      // Filtrar por año
      const filtra = <T>(arr: T[]) =>
        this.selectedYear === 'all' ? arr : arr.filter(i => this.getYear(i) === this.selectedYear);

      this.actualizarTodo(filtra(alertas), filtra(maltratos), filtra(conflictos));
    });
  }

  private actualizarTodo(alertas: any[], maltratos: any[], conflictos: any[]) {
    const aInf  = alertas.filter(a => a.estadoInvestigacion === 'Informado').length;
    const aRem  = alertas.filter(a => a.estadoInvestigacion === 'Remitido').length;
    const aCon  = alertas.filter(a => a.estadoInvestigacion === 'Concluido').length;
    const mInf  = maltratos.filter(m => m.estadoInvestigacion === 'Informado').length;
    const mDes  = maltratos.filter(m => m.estadoInvestigacion === 'Desestimado').length;
    const cInf  = conflictos.filter(c => c.estadoInvestigacion === 'Informado').length;
    const cCon  = conflictos.filter(c => c.estadoInvestigacion === 'Concluido').length;

    // KPI cards
    const kpiMap: Record<string, number> = {
      alerta:    alertas.length,
      maltrato:  maltratos.length,
      conflicto: conflictos.length,
      remitidas: aRem,
      activas:   aInf,
      inactivas: aCon + aRem,
    };
    this.exps = this.exps.map(e => ({ ...e, amount: kpiMap[e.key] ?? 0 }));

    const periodo = this.tituloPeriodo;

    // 1. Barras por tipo
    this.barChartOptions = {
      ...this.barChartOptions,
      series: [{ name: 'Casos', data: [alertas.length, maltratos.length, conflictos.length] }],
      title: { text: `Total por tipo — ${periodo}`, style: { fontSize: '13px', fontWeight: '600' } },
    };
    this.barChart?.updateOptions(this.barChartOptions);

    // 2. Donut alertas
    this.donutChartOptions = {
      ...this.donutChartOptions,
      series: [aInf, aCon, aRem],
      title: { text: `Distribución de Alertas — ${periodo}`, style: { fontSize: '13px', fontWeight: '600' } },
    };
    this.donutChart?.updateOptions(this.donutChartOptions);

    // 3. Stacked estado
    this.stackedChartOptions = {
      ...this.stackedChartOptions,
      series: [
        { name: 'Informado',   data: [aInf, mInf, cInf] },
        { name: 'Concluido',   data: [aCon, 0, cCon]    },
        { name: 'Remitido',    data: [aRem, 0, 0]        },
        { name: 'Desestimado', data: [0, mDes, 0]        },
      ],
      title: { text: `Estado de investigación — ${periodo}`, style: { fontSize: '13px', fontWeight: '600' } },
    };
    this.stackedChart?.updateOptions(this.stackedChartOptions);

    // 4. Area mensual
    this.actualizarAreaMensual(alertas, maltratos, conflictos, periodo);

    // 4b. Proyección
    this.actualizarProyeccion(alertas, maltratos, conflictos, periodo);

    // 5. Radial — tasa de resolución
    const pctA = alertas.length   ? Math.round((aCon + aRem) / alertas.length   * 100) : 0;
    const pctM = maltratos.length ? Math.round(mDes           / maltratos.length  * 100) : 0;
    const pctC = conflictos.length? Math.round(cCon           / conflictos.length * 100) : 0;
    this.radialChartOptions = {
      ...this.radialChartOptions,
      series: [pctA, pctM, pctC],
      title: { text: `Tasa de resolución — ${periodo}`, style: { fontSize: '13px', fontWeight: '600' } },
    };
    this.radialChart?.updateOptions(this.radialChartOptions);

    // 6. Horizontal personas
    const aVic  = alertas.length;   // cada alerta = 1 desaparecido
    const mVic  = maltratos.reduce((s: number, m: any)  => s + (m.victimas?.length   || 0), 0);
    const mInfP = maltratos.reduce((s: number, m: any)  => s + (m.infractores?.length || 0), 0);
    const cVic  = conflictos.reduce((s: number, c: any) => s + (c.victimas?.length    || 0), 0);
    const cInfP = conflictos.reduce((s: number, c: any) => s + (c.infractores?.length || 0), 0);
    this.hBarChartOptions = {
      ...this.hBarChartOptions,
      series: [
        { name: 'Víctimas',               data: [aVic, mVic,  cVic]  },
        { name: 'Sindicados/Infractores',  data: [0,    mInfP, cInfP] },
      ],
      title: { text: `Personas involucradas — ${periodo}`, style: { fontSize: '13px', fontWeight: '600' } },
    };
    this.hBarChart?.updateOptions(this.hBarChartOptions);
  }

  private actualizarAreaMensual(alertas: any[], maltratos: any[], conflictos: any[], periodo: string) {
    const series = { Alerta: new Array(12).fill(0), Maltrato: new Array(12).fill(0), Conflicto: new Array(12).fill(0) };
    const getMonth = (v: any) => {
      const d = new Date(v?.fecha || v?.fechaRegistro || v?.createdAt);
      return isNaN(+d) ? -1 : d.getMonth();
    };
    alertas.forEach(a   => { const m = getMonth(a); if (m >= 0) series.Alerta[m]++;   });
    maltratos.forEach(m => { const i = getMonth(m); if (i >= 0) series.Maltrato[i]++; });
    conflictos.forEach(c=> { const j = getMonth(c); if (j >= 0) series.Conflicto[j]++;});

    this.areaChartOptions = {
      ...this.areaChartOptions,
      series: [
        { name: 'Alerta',    data: series.Alerta    },
        { name: 'Maltrato',  data: series.Maltrato  },
        { name: 'Conflicto', data: series.Conflicto },
      ],
      title: { text: `Tendencia mensual — ${periodo}`, style: { fontSize: '13px', fontWeight: '600' } },
    };
    this.areaChart?.updateOptions(this.areaChartOptions);
  }

  private actualizarProyeccion(alertas: any[], maltratos: any[], conflictos: any[], periodo: string) {
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const hoy = new Date();
    const mesActual = hoy.getMonth(); // 0-11

    // Contar por mes (índice 0-11) según createdAt
    const porMes = (arr: any[]) => {
      const counts = new Array(12).fill(0);
      arr.forEach(v => {
        const d = new Date(v?.createdAt || v?.fecha || v?.fechaRegistro);
        if (!isNaN(+d)) counts[d.getMonth()]++;
      });
      return counts;
    };

    const cA = porMes(alertas);
    const cM = porMes(maltratos);
    const cC = porMes(conflictos);

    // Moving average de 3 meses → proyectar los 2 meses siguientes
    const ma3 = (counts: number[], fromIdx: number): [number, number] => {
      const last3 = [
        counts[(fromIdx - 2 + 12) % 12],
        counts[(fromIdx - 1 + 12) % 12],
        counts[fromIdx],
      ];
      const p1 = Math.round((last3[0] + last3[1] + last3[2]) / 3);
      const p2 = Math.round((last3[1] + last3[2] + p1) / 3);
      return [p1, p2];
    };

    const [pA1, pA2] = ma3(cA, mesActual);
    const [pM1, pM2] = ma3(cM, mesActual);
    const [pC1, pC2] = ma3(cC, mesActual);

    // Categorías: 12 meses históricos + 2 proyectados
    const cats = MESES.map((m, i) => i === mesActual ? `${m} ◄` : m);
    const mes1 = MESES[(mesActual + 1) % 12];
    const mes2 = MESES[(mesActual + 2) % 12];
    cats.push(`${mes1} (est.)`, `${mes2} (est.)`);

    // Anotación vertical en el mes actual
    const labelHoy = cats[mesActual];

    this.forecastChartOptions = {
      ...this.forecastChartOptions,
      series: [
        { name: 'Alerta',    data: [...cA, pA1, pA2] },
        { name: 'Maltrato',  data: [...cM, pM1, pM2] },
        { name: 'Conflicto', data: [...cC, pC1, pC2] },
      ],
      xaxis: { categories: cats, tooltip: { enabled: false } },
      annotations: {
        xaxis: [{
          x: labelHoy,
          borderColor: '#9E9E9E',
          borderWidth: 1,
          strokeDashArray: 4,
          label: { text: 'Mes actual', style: { color: '#fff', background: '#9E9E9E', fontSize: '11px' } }
        }]
      },
      title: { text: `Proyección — ${periodo} + 2 meses`, style: { fontSize: '13px', fontWeight: '600' } },
    };
    this.forecastChart?.updateOptions(this.forecastChartOptions);
  }

  private getYear(v: any): number | null {
    const raw = v?.fecha ?? v?.fechaRegistro ?? v?.createdAt;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.getFullYear();
  }

  get tituloPeriodo(): string {
    return this.selectedYear === 'all' ? 'General' : `Año ${this.selectedYear}`;
  }

  onYearChange(y: YearOption) {
    this.selectedYear = y;
    this.cargarDatos();
  }
}
