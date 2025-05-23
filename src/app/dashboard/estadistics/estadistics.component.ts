import { ConflictoService } from './../../casos/services/conflicto.service';
import { AlertaService } from './../../casos/services/alerta.service';
import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MaltratoService } from '../../casos/services/maltrato.service';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ChartComponent,
} from 'ng-apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { delay, finalize, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Definir tipos para las opciones de las gráficas
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis?: any;
  title: ApexTitleSubtitle;
  plotOptions?: any;
  responsive?: ApexResponsive[];
};

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
};

@Component({
  selector: 'app-estadistics',
  imports: [MatCardModule, MatGridListModule, NgApexchartsModule, CommonModule, MatProgressSpinnerModule],

  templateUrl: './estadistics.component.html',
  styleUrl: './estadistics.component.css',
})
export default class EstadisticsComponent {

  isLoading = false;
  @ViewChild('barChart') barChart!: ChartComponent;
  @ViewChild('donutChart') donutChart!: ChartComponent;

  public barChartData: any;
  public donutChartData: any;


  exps = [
    { tag: 'Alerta Alba-Kenet', amount: 0 },
    { tag: 'Casos de Maltrato', amount: 0 },
    { tag: 'Casos de Conflicto', amount: 0 },
    { tag: 'Remitidos', amount: 0 },
    { tag: 'Alertas Activas', amount: 0 },
    { tag: 'Alertas Inactivas', amount: 0 },
  ];

  // Opciones para la gráfica de barras
  public barChartOptions: ChartOptions;
  public donutChartOptions: DonutChartOptions;

  constructor(
    private alertaService: AlertaService,
    private maltratoService: MaltratoService,
    private conflictoService: ConflictoService
  ) {

    this.barChartOptions = {
      series: [
        { name: 'Casos', data: [] }
      ],
      chart: {
        type: 'bar',
        height: 350,
        width: 400,        // ← ancho desktop
        toolbar: { show: false },
        redrawOnParentResize: true
      },
         plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 5,
            borderRadiusApplication: 'end'
          },
        },
      xaxis: {
        categories: ['Alertas', 'Maltratos', 'Conflictos'],
        labels: { rotate: 0 }
      },
      yaxis: {
        min: 0,
        tickAmount: 5
      },
      title: {
        text: 'Casos Registrados por Tipo'
      },

    };



    this.donutChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350,
      },
      labels: ['Activas', 'Inactivas', 'Remitidas'],

      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: 'bottom',
            },

          },
        },
      ],
    };

  }


  ngOnInit(): void {
    this.cargarDatos();
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



}
