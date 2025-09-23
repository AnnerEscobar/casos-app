import { ConflictoService } from './../../casos/services/conflicto.service';
import { AlertaService } from './../../casos/services/alerta.service';
import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MaltratoService } from '../../casos/services/maltrato.service';

import {
  ApexAxisChartSeries, ApexNonAxisChartSeries,
  ApexChart, ApexXAxis, ApexYAxis, ApexTitleSubtitle,
  ApexDataLabels, ApexPlotOptions, ApexGrid, ApexTooltip,
  ApexLegend, ApexStroke, ApexResponsive,
} from 'ng-apexcharts';

import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { delay, finalize, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from './dashboard.service';
import { MatIconModule } from '@angular/material/icon';
import { ApexOptions} from 'ng-apexcharts';


// Definir tipos para las opciones de las gráficas
type BarChartOptionsStrict = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  colors?: string[];
  plotOptions?: ApexPlotOptions;
  dataLabels?: ApexDataLabels;
  grid?: ApexGrid;
  tooltip?: ApexTooltip;
  legend?: ApexLegend;
};

type DonutChartOptionsStrict = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  stroke?: ApexStroke;
  dataLabels?: ApexDataLabels;
  plotOptions?: ApexPlotOptions;
  legend?: ApexLegend;
  tooltip?: ApexTooltip;
  responsive: ApexResponsive[];
  title: ApexTitleSubtitle;
};

const COLORS = {
  alerta: '#1976D2', // azul
  maltrato: '#D81B60', // rosa
  conflicto: '#7E57C2', // violeta
  activa: '#1976D2', // azul
  inactiva: '#9E9E9E', // gris
  remitida: '#FFB300', // ámbar
  grid: '#ECEFF4'
};

@Component({
  selector: 'app-estadistics',
  imports: [MatCardModule, MatGridListModule, NgApexchartsModule, CommonModule, MatProgressSpinnerModule, MatIconModule],

  templateUrl: './estadistics.component.html',
  styleUrl: './estadistics.component.css',
})

export default class EstadisticsComponent {

  isLoading = false;
  @ViewChild('barChart') barChart!: ChartComponent;
  @ViewChild('donutChart') donutChart!: ChartComponent;
  @ViewChild('barChartMensual') barChartMensual!: ChartComponent;


public barChartOptions: BarChartOptionsStrict;
public donutChartOptions: DonutChartOptionsStrict;
public barChartMensualOptions: BarChartOptionsStrict;


  // Tarjetas: ahora con key + icon para poder dar estilos por tipo
  exps: Array<{
    key: 'alerta' | 'maltrato' | 'conflicto' | 'remitidas' | 'activas' | 'inactivas';
    tag: string;
    amount: number;
    icon: string;
    delta?: number; // opcional, por si luego muestras variación
  }> = [
      { key: 'alerta', tag: 'Alerta Alba-Kenet', amount: 0, icon: 'notifications_active' },
      { key: 'maltrato', tag: 'Casos de Maltrato', amount: 0, icon: 'volunteer_activism' },
      { key: 'conflicto', tag: 'Casos de Conflicto', amount: 0, icon: 'gavel' },
      { key: 'remitidas', tag: 'Remitidos', amount: 0, icon: 'outgoing_mail' },
      { key: 'activas', tag: 'Alertas Activas', amount: 0, icon: 'task_alt' },
      { key: 'inactivas', tag: 'Alertas Inactivas', amount: 0, icon: 'remove_circle' },
    ];

  onKpiClick(item: (typeof this.exps)[number]) {
    // Opcional: aquí podrías disparar filtros/scroll a la tabla
    // console.log('KPI click', item.key);
  }


  /*   exps = [
      { tag: 'Alerta Alba-Kenet', amount: 0 },
      { tag: 'Casos de Maltrato', amount: 0 },
      { tag: 'Casos de Conflicto', amount: 0 },
      { tag: 'Remitidos', amount: 0 },
      { tag: 'Alertas Activas', amount: 0 },
      { tag: 'Alertas Inactivas', amount: 0 },
    ]; */

  // Opciones para la gráfica de barras


  constructor(
    private alertaService: AlertaService,
    private maltratoService: MaltratoService,
    private conflictoService: ConflictoService,
    private dashboardSerivice: DashboardService, // Asegúrate de importar el servicio correcto
  ) {

    this.barChartOptions = {
      series: [{ name: 'Casos', data: [] }],
      chart: { type: 'bar', height: 350, toolbar: { show: false }, redrawOnParentResize: true },

      // colores por barra en el orden de xaxis.categories
      colors: [COLORS.alerta, COLORS.maltrato, COLORS.conflicto],
      plotOptions: {
        bar: {
          distributed: true,
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 6,
          borderRadiusApplication: 'end',
          dataLabels: { position: 'top' }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}`,
        offsetY: -14,
        style: { fontSize: '12px' }
      },
      xaxis: { categories: ['Alertas', 'Maltratos', 'Conflictos'], labels: { rotate: 0 } },
      yaxis: { min: 0, tickAmount: 5, labels: { formatter: (v: number) => `${v}` } },
      grid: { borderColor: COLORS.grid, strokeDashArray: 2 },
      title: { text: 'Casos Registrados por Tipo' },
      tooltip: { y: { formatter: (v: number) => `${v} casos` } }
    };



this.donutChartOptions = {
  series: [],
  chart: { type: 'donut', height: 350, redrawOnParentResize: true, parentHeightOffset: 0 },
  title: { text: 'Casos Registrados por Tipo' },
  labels: ['Activas', 'Inactivas', 'Remitidas'],
  colors: [COLORS.activa, COLORS.inactiva, COLORS.remitida],
  stroke: { colors: ['#fff'] },
  dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%` },
  plotOptions: {
    pie: {
      offsetX: 0,
      donut: { size: '66%', labels: { show: true, total: { show: true, label: 'Total' } } }
    }
  },
  legend: { position: 'bottom', horizontalAlign: 'center' },
  responsive: [
    { breakpoint: 1280, options: { chart: { height: 340 }, plotOptions: { pie: { donut: { size: '62%' } } } } },
    { breakpoint: 992,  options: { chart: { height: 320 }, plotOptions: { pie: { donut: { size: '58%' } } } } },
    { breakpoint: 768,  options: { chart: { height: 300 }, plotOptions: { pie: { donut: { size: '54%' } } } } }
  ]
};



  this.barChartMensualOptions = {
  series: [],
  chart: { type: 'bar', height: 350, toolbar: { show: false }, redrawOnParentResize: true },
  colors: [COLORS.alerta, COLORS.maltrato, COLORS.conflicto],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '45%',
      borderRadius: 6,
      borderRadiusApplication: 'end'
    }
  },
  dataLabels: { enabled: false },
  xaxis: { categories: [], labels: { rotate: 0 } },
  yaxis: { min: 0, tickAmount: 5 },
  legend: { position: 'top', horizontalAlign: 'right' },
  grid: { borderColor: COLORS.grid, strokeDashArray: 2 },
  title: { text: 'Casos por mes (2025)' },
  tooltip: { y: { formatter: (v: number) => `${v} casos` } }
};



  }


  ngOnInit(): void {
    this.cargarDatos();
    // Agrega esta llamada
    this.dashboardSerivice.getEstadisticasMensuales().subscribe(data => {
      this.actualizarGraficaPorMes(data);
    });
  }

  cargarDatos(): void {
    this.isLoading = true;
    forkJoin({
      alertas: this.alertaService.getAlertas(),
      maltratos: this.maltratoService.getMaltratos(),
      conflictos: this.conflictoService.getConflictos()
    }).pipe(
      delay(500), // Simular un retraso de 1 segundo
      finalize(() => this.isLoading = false)   // se apaga el spinner aquí
    ).subscribe(({ alertas, maltratos, conflictos }) => {
      this.calcularMetricas(alertas, maltratos, conflictos);
    });
  }


  calcularMetricas(alertas: any[], maltratos: any[], conflictos: any[]): void {

    // Calcular métricas para alertas
    const alertasActivas = alertas.filter((alerta) => alerta.estadoInvestigacion === 'Informado').length;
    const alertasRemitidas = alertas.filter((alerta) => alerta.estadoInvestigacion === 'Remitido').length;
    const alertasConcluidas = alertas.filter((alerta) => alerta.estadoInvestigacion === 'Concluido').length;

    // Actualizar las tarjetas
    this.exps[0].amount = alertas.length; // Alerta Alba-Kenet
    this.exps[1].amount = maltratos.length; // Casos de Maltrato
    this.exps[2].amount = conflictos.length; // Casos de Conflicto
    this.exps[3].amount = alertasRemitidas; // Remitidos
    this.exps[4].amount = alertasActivas; // Alertas Activas
    this.exps[5].amount = alertasConcluidas + alertasRemitidas; // Alertas Inactivas
    this.actualizarGraficas(alertas, maltratos, conflictos);
  }


  actualizarGraficas(alertas: any[], maltratos: any[], conflictos: any[]): void {
    // Actualizar gráfica de barras
    this.barChartOptions.series = [
      {
        name: 'Casos',
        data: [alertas.length, maltratos.length, conflictos.length],
      },
    ];

    // Verificar si barChart está definido antes de llamar a updateSeries
    if (this.barChart) {
      this.barChart.updateSeries([
        {
          name: 'Casos',
          data: [alertas.length, maltratos.length, conflictos.length],
        },
      ]);
    }

    // Actualizar gráfica de donut
    const alertasActivas = alertas.filter((alerta) => alerta.estadoInvestigacion === 'Informado').length;
    const alertasInactivas = alertas.filter((alerta) => alerta.estadoInvestigacion === 'Concluido').length;
    const alertasRemitidas = alertas.filter((alerta) => alerta.estadoInvestigacion === 'Remitido').length;

    this.donutChartOptions.series = [alertasActivas, alertasInactivas, alertasRemitidas];

    // Verificar si donutChart está definido antes de llamar a updateSeries
    if (this.donutChart) {
      this.donutChart.updateSeries([alertasActivas, alertasInactivas, alertasRemitidas]);
    }
  }



  actualizarGraficaPorMes(data: { mes: string; tipo: 'Alerta' | 'Maltrato' | 'Conflicto'; total: number }[]): void {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const series: Record<'Alerta' | 'Maltrato' | 'Conflicto', number[]> = {
      Alerta: new Array(12).fill(0),
      Maltrato: new Array(12).fill(0),
      Conflicto: new Array(12).fill(0),
    };

    data.forEach(d => {
      const mesIndex = meses.indexOf(d.mes);
      if (mesIndex !== -1 && series[d.tipo]) {
        series[d.tipo][mesIndex] = d.total;
      }
    });

    this.barChartMensualOptions = {
      ...this.barChartMensualOptions,
      series: [
        { name: 'Alerta', data: series.Alerta },
        { name: 'Maltrato', data: series.Maltrato },
        { name: 'Conflicto', data: series.Conflicto },
      ],
      xaxis: {
        categories: meses,
      },
    };

    if (this.barChartMensual) {
      this.barChartMensual.updateOptions(this.barChartMensualOptions);
    }




  }











}
