import { CommonModule } from '@angular/common';

import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import {
  ChartComponent,
  NgApexchartsModule
} from 'ng-apexcharts';

import { finalize } from 'rxjs';

import {
  DashboardResponse,
  DashboardService
} from './dashboard.service';

import {
  AuthService
} from '../../auth/auth-service/auth.service';


type YearOption = number | 'all';


type KpiKey =
  | 'total'
  | 'alerta'
  | 'maltrato'
  | 'conflicto'
  | 'pendientes'
  | 'rechazados';


interface KpiCard {
  key: KpiKey;
  tag: string;
  amount: number;
  icon: string;
}


const C = {

  alerta: '#1976D2',
  maltrato: '#D81B60',
  conflicto: '#7E57C2',

  informado: '#42A5F5',
  concluido: '#43A047',
  remitido: '#FFB300',
  desestimado: '#EF5350',

  grid: '#ECEFF4'

};


@Component({

  selector: 'app-estadistics',

  imports: [

    CommonModule,
    FormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatSelectModule,

    NgApexchartsModule

  ],

  templateUrl:
    './estadistics.component.html',

  styleUrl:
    './estadistics.component.css',

})
export default class EstadisticsComponent
  implements OnInit, OnDestroy {


  /* =====================================================
     CHARTS
  ===================================================== */

  @ViewChild('barChart')
  barChart!: ChartComponent;

  @ViewChild('stackedChart')
  stackedChart!: ChartComponent;

  @ViewChild('areaChart')
  areaChart!: ChartComponent;

  @ViewChild('investigatorChart')
  investigatorChart!: ChartComponent;


  barChartOptions: any;
  stackedChartOptions: any;
  areaChartOptions: any;
  investigatorChartOptions: any;


  /* =====================================================
     ESTADO GENERAL
  ===================================================== */

  isLoading = false;

  dashboardRole = '';

  dashboardScope:
    'PERSONAL' |
    'GLOBAL' =
    'GLOBAL';


  /* =====================================================
     DATOS BASE
  ===================================================== */

  private alertasBase: any[] = [];

  private maltratosBase: any[] = [];

  private conflictosBase: any[] = [];


  private pendientes = 0;

  private rechazados = 0;


  investigadoresConRegistros = 0;


  /* =====================================================
     KPIs
  ===================================================== */

  kpis: KpiCard[] = [];


  /* =====================================================
     FILTRO DE AÑO
  ===================================================== */

  currentYear =
    new Date().getFullYear();

  selectedYear:
    YearOption =
    'all';

  yearsDisponibles:
    YearOption[] =
    ['all'];


  /* =====================================================
     SESIÓN
  ===================================================== */

  sessionRemainingLabel =
    '--:--';

  sessionWarning =
    false;

  private sessionTimerId:
    ReturnType<typeof setInterval> |
    null =
    null;


  constructor(

    private dashboardService:
      DashboardService,

    private authService:
      AuthService

  ) {

    this.initCharts();

  }


  ngOnInit(): void {

    this.cargarDatos();

    this.iniciarContadorSesion();

  }


  ngOnDestroy(): void {

    if (
      this.sessionTimerId
    ) {

      clearInterval(
        this.sessionTimerId
      );

    }

  }


  /* =====================================================
     ROLES
  ===================================================== */

  get esInvestigador(): boolean {

    return (
      this.dashboardRole ===
      'Investigador'
    );

  }


  get esAnalista(): boolean {

    return (
      this.dashboardRole ===
      'Analista'
    );

  }


  get esJefe(): boolean {

    return (
      this.dashboardRole ===
      'Jefe'
    );

  }


  get esAdministrador(): boolean {

    return (
      this.dashboardRole ===
      'Administrador'
    );

  }


  get esSupervision(): boolean {

    return (
      this.esAnalista ||
      this.esJefe
    );

  }


  /* =====================================================
     TEXTOS DEL DASHBOARD
  ===================================================== */

  get dashboardTitle(): string {

    if (
      this.esInvestigador
    ) {

      return 'Mi panel de casos';

    }


    if (
      this.esAnalista
    ) {

      return 'Panel de análisis y supervisión';

    }


    if (
      this.esJefe
    ) {

      return 'Panel de supervisión';

    }


    if (
      this.esAdministrador
    ) {

      return 'Resumen general del sistema';

    }


    return 'Dashboard';

  }


  get dashboardSubtitle(): string {

    if (
      this.esInvestigador
    ) {

      return (
        `Casos registrados por tu usuario · ${this.tituloPeriodo}`
      );

    }


    if (
      this.esAnalista
    ) {

      return (
        `Panorama general de casos y autorizaciones · ${this.tituloPeriodo}`
      );

    }


    if (
      this.esJefe
    ) {

      return (
        `Panorama general de la actividad operativa · ${this.tituloPeriodo}`
      );

    }


    return (
      `Resumen general · ${this.tituloPeriodo}`
    );

  }


  get scopeLabel(): string {

    return this.esInvestigador
      ? 'Datos personales'
      : 'Datos generales';

  }


  /* =====================================================
     INICIALIZAR GRÁFICAS
  ===================================================== */

  private initCharts(): void {


    /* CASOS POR TIPO */

    this.barChartOptions = {

      series: [
        {
          name: 'Casos',
          data: [0, 0, 0]
        }
      ],

      chart: {
        type: 'bar',
        height: 310,
        toolbar: {
          show: false
        },
        redrawOnParentResize: true
      },

      colors: [
        C.alerta,
        C.maltrato,
        C.conflicto
      ],

      plotOptions: {

        bar: {
          distributed: true,
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 6,
          borderRadiusApplication: 'end'
        }

      },

      dataLabels: {

        enabled: true,

        formatter:
          (value: number) =>
            `${value}`,

        offsetY: -12,

        style: {
          fontSize: '12px',
          colors: ['#555']
        }

      },

      xaxis: {
        categories: [
          'Alertas',
          'Maltratos',
          'Conflictos'
        ]
      },

      yaxis: {
        min: 0,
        tickAmount: 5
      },

      legend: {
        show: false
      },

      grid: {
        borderColor: C.grid,
        strokeDashArray: 2
      },

      tooltip: {

        y: {
          formatter:
            (value: number) =>
              `${value} casos`
        }

      },

      title: {

        text:
          'Casos por tipo',

        style: {
          fontSize: '13px',
          fontWeight: '600'
        }

      }

    };


    /* ESTADO DE INVESTIGACIÓN */

    this.stackedChartOptions = {

      series: [

        {
          name: 'Informado',
          data: [0, 0, 0]
        },

        {
          name: 'Concluido',
          data: [0, 0, 0]
        },

        {
          name: 'Remitido',
          data: [0, 0, 0]
        },

        {
          name: 'Desestimado',
          data: [0, 0, 0]
        }

      ],

      chart: {

        type: 'bar',
        height: 310,
        stacked: true,

        toolbar: {
          show: false
        },

        redrawOnParentResize: true

      },

      colors: [

        C.informado,
        C.concluido,
        C.remitido,
        C.desestimado

      ],

      plotOptions: {

        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4
        }

      },

      dataLabels: {
        enabled: false
      },

      xaxis: {

        categories: [
          'Alertas',
          'Maltratos',
          'Conflictos'
        ]

      },

      yaxis: {
        min: 0,
        tickAmount: 5
      },

      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '11px'
      },

      fill: {
        opacity: 1
      },

      grid: {
        borderColor: C.grid,
        strokeDashArray: 2
      },

      tooltip: {

        y: {
          formatter:
            (value: number) =>
              `${value} casos`
        }

      },

      title: {

        text:
          'Estado de investigación',

        style: {
          fontSize: '13px',
          fontWeight: '600'
        }

      }

    };


    /* EVOLUCIÓN MENSUAL */

    this.areaChartOptions = {

      series: [

        {
          name: 'Alerta',
          data: []
        },

        {
          name: 'Maltrato',
          data: []
        },

        {
          name: 'Conflicto',
          data: []
        }

      ],

      chart: {

        type: 'area',
        height: 330,

        toolbar: {
          show: false
        },

        redrawOnParentResize: true

      },

      colors: [
        C.alerta,
        C.maltrato,
        C.conflicto
      ],

      dataLabels: {
        enabled: false
      },

      stroke: {
        curve: 'smooth',
        width: 2
      },

      fill: {

        type: 'gradient',

        gradient: {

          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,

          stops: [
            0,
            90,
            100
          ]

        }

      },

      xaxis: {
        categories: []
      },

      yaxis: {
        min: 0,
        tickAmount: 5
      },

      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px'
      },

      grid: {
        borderColor: C.grid,
        strokeDashArray: 2
      },

      tooltip: {

        y: {
          formatter:
            (value: number) =>
              `${value} casos`
        }

      },

      title: {

        text:
          'Evolución mensual',

        style: {
          fontSize: '13px',
          fontWeight: '600'
        }

      }

    };


    /* CASOS POR INVESTIGADOR */

    this.investigatorChartOptions = {

      series: [
        {
          name: 'Casos',
          data: []
        }
      ],

      chart: {

        type: 'bar',
        height: 300,

        toolbar: {
          show: false
        },

        redrawOnParentResize: true

      },

      plotOptions: {

        bar: {

          horizontal: true,

          borderRadius: 5,

          borderRadiusApplication:
            'end'

        }

      },

      dataLabels: {

        enabled: true,

        formatter:
          (value: number) =>
            `${value}`

      },

      xaxis: {
        categories: []
      },

      grid: {
        borderColor: C.grid,
        strokeDashArray: 2
      },

      tooltip: {

        y: {
          formatter:
            (value: number) =>
              `${value} casos`
        }

      },

      title: {

        text:
          'Casos registrados por investigador',

        style: {
          fontSize: '13px',
          fontWeight: '600'
        }

      }

    };

  }


  /* =====================================================
     CARGAR DASHBOARD
  ===================================================== */

  cargarDatos(): void {

    this.isLoading =
      true;


    this.dashboardService
      .getDashboard()
      .pipe(

        finalize(
          () =>
            this.isLoading =
              false
        )

      )
      .subscribe({

        next: (
          data:
            DashboardResponse
        ) => {

          this.dashboardRole =
            data.role;

          this.dashboardScope =
            data.alcance;


          this.alertasBase =
            data.alertas || [];

          this.maltratosBase =
            data.maltratos || [];

          this.conflictosBase =
            data.conflictos || [];


          this.pendientes =
            data
              .autorizaciones
              ?.pendientes
              ?.total || 0;


          this.rechazados =
            data
              .autorizaciones
              ?.rechazados
              ?.total || 0;


          this.generarAniosDisponibles();

          this.aplicarFiltroActual();

        },


        error: (
          error
        ) => {

          console.error(
            'Error al cargar dashboard:',
            error
          );

        }

      });

  }


  /* =====================================================
     AÑOS
  ===================================================== */

  private generarAniosDisponibles():
    void {

    const years =
      new Set<number>();


    [
      ...this.alertasBase,
      ...this.maltratosBase,
      ...this.conflictosBase
    ]
      .forEach(
        caso => {

          const year =
            this.getYear(
              caso
            );


          if (
            year !== null
          ) {

            years.add(
              year
            );

          }

        }
      );


    this.yearsDisponibles = [

      'all',

      ...Array
        .from(
          years
        )
        .sort(
          (a, b) =>
            b - a
        )

    ];

  }


  onYearChange(
    year: YearOption
  ): void {

    this.selectedYear =
      year;

    this.aplicarFiltroActual();

  }


  private aplicarFiltroActual():
    void {

    const alertas =
      this.filtrarPorPeriodo(
        this.alertasBase
      );

    const maltratos =
      this.filtrarPorPeriodo(
        this.maltratosBase
      );

    const conflictos =
      this.filtrarPorPeriodo(
        this.conflictosBase
      );


    this.actualizarTodo(

      alertas,

      maltratos,

      conflictos

    );

  }


  private filtrarPorPeriodo<T>(
    registros: T[]
  ): T[] {

    if (
      this.selectedYear ===
      'all'
    ) {

      return registros;

    }


    return registros.filter(
      registro =>
        this.getYear(
          registro
        ) ===
        this.selectedYear
    );

  }


  /* =====================================================
     ACTUALIZAR TODO
  ===================================================== */

  private actualizarTodo(

    alertas: any[],

    maltratos: any[],

    conflictos: any[]

  ): void {


    this.actualizarKpis(

      alertas,

      maltratos,

      conflictos

    );


    this.actualizarCasosPorTipo(

      alertas,

      maltratos,

      conflictos

    );


    this.actualizarEstados(

      alertas,

      maltratos,

      conflictos

    );


    this.actualizarEvolucionMensual(

      alertas,

      maltratos,

      conflictos

    );


    if (
      this.esSupervision
    ) {

      this.actualizarCasosPorInvestigador(

        alertas,

        maltratos,

        conflictos

      );

    }

  }


  /* =====================================================
     KPIs
  ===================================================== */

  private actualizarKpis(

    alertas: any[],

    maltratos: any[],

    conflictos: any[]

  ): void {


    const total =

      alertas.length +
      maltratos.length +
      conflictos.length;


    if (
      this.esInvestigador
    ) {

      this.kpis = [

        {
          key: 'total',
          tag: 'Mis casos aprobados',
          amount: total,
          icon: 'folder_open'
        },

        {
          key: 'alerta',
          tag: 'Mis Alertas',
          amount: alertas.length,
          icon: 'notifications_active'
        },

        {
          key: 'maltrato',
          tag: 'Mis Maltratos',
          amount: maltratos.length,
          icon: 'volunteer_activism'
        },

        {
          key: 'conflicto',
          tag: 'Mis Conflictos',
          amount: conflictos.length,
          icon: 'gavel'
        },

        {
          key: 'pendientes',
          tag: 'Pendientes actuales',
          amount: this.pendientes,
          icon: 'schedule'
        },

        {
          key: 'rechazados',
          tag: 'Rechazados actuales',
          amount: this.rechazados,
          icon: 'error_outline'
        }

      ];

      return;

    }


    if (
      this.esAnalista ||
      this.esJefe
    ) {

      this.kpis = [

        {
          key: 'total',
          tag: 'Casos oficiales',
          amount: total,
          icon: 'folder_open'
        },

        {
          key: 'alerta',
          tag: 'Alertas Alba-Keneth',
          amount: alertas.length,
          icon: 'notifications_active'
        },

        {
          key: 'maltrato',
          tag: 'Casos de Maltrato',
          amount: maltratos.length,
          icon: 'volunteer_activism'
        },

        {
          key: 'conflicto',
          tag: 'Casos de Conflicto',
          amount: conflictos.length,
          icon: 'gavel'
        },

        {
          key: 'pendientes',
          tag: 'Pendientes de autorización',
          amount: this.pendientes,
          icon: 'pending_actions'
        },

        {
          key: 'rechazados',
          tag: 'Registros rechazados',
          amount: this.rechazados,
          icon: 'assignment_late'
        }

      ];

      return;

    }


    /*
     * Administrador:
     * resumen general sin saturarlo
     * de información operativa.
     */

    this.kpis = [

      {
        key: 'total',
        tag: 'Casos oficiales',
        amount: total,
        icon: 'folder_open'
      },

      {
        key: 'alerta',
        tag: 'Alertas Alba-Keneth',
        amount: alertas.length,
        icon: 'notifications_active'
      },

      {
        key: 'maltrato',
        tag: 'Casos de Maltrato',
        amount: maltratos.length,
        icon: 'volunteer_activism'
      },

      {
        key: 'conflicto',
        tag: 'Casos de Conflicto',
        amount: conflictos.length,
        icon: 'gavel'
      }

    ];

  }


  /* =====================================================
     CASOS POR TIPO
  ===================================================== */

  private actualizarCasosPorTipo(

    alertas: any[],

    maltratos: any[],

    conflictos: any[]

  ): void {

    const titulo =
      this.esInvestigador
        ? `Mis casos por tipo — ${this.tituloPeriodo}`
        : `Casos por tipo — ${this.tituloPeriodo}`;


    this.barChartOptions = {

      ...this.barChartOptions,

      series: [

        {
          name: 'Casos',

          data: [

            alertas.length,
            maltratos.length,
            conflictos.length

          ]

        }

      ],

      title: {

        text: titulo,

        style: {
          fontSize: '13px',
          fontWeight: '600'
        }

      }

    };


    this.barChart
      ?.updateOptions(
        this.barChartOptions
      );

  }


  /* =====================================================
     ESTADOS
  ===================================================== */

  private actualizarEstados(

    alertas: any[],

    maltratos: any[],

    conflictos: any[]

  ): void {


    const aInf =
      alertas.filter(
        caso =>
          caso.estadoInvestigacion ===
          'Informado'
      ).length;


    const aCon =
      alertas.filter(
        caso =>
          caso.estadoInvestigacion ===
          'Concluido'
      ).length;


    const aRem =
      alertas.filter(
        caso =>
          caso.estadoInvestigacion ===
          'Remitido'
      ).length;


    const mInf =
      maltratos.filter(
        caso =>
          caso.estadoInvestigacion ===
          'Informado'
      ).length;


    const mDes =
      maltratos.filter(
        caso =>
          caso.estadoInvestigacion ===
          'Desestimado'
      ).length;


    const cInf =
      conflictos.filter(
        caso =>
          caso.estadoInvestigacion ===
          'Informado'
      ).length;


    const cDes =
      conflictos.filter(
        caso =>
          caso.estadoInvestigacion ===
          'Desestimado'
      ).length;


    const titulo =
      this.esInvestigador

        ? `Estado de mis investigaciones — ${this.tituloPeriodo}`

        : `Estado de investigación — ${this.tituloPeriodo}`;


    this.stackedChartOptions = {

      ...this.stackedChartOptions,

      series: [

        {
          name: 'Informado',

          data: [
            aInf,
            mInf,
            cInf
          ]
        },

        {
          name: 'Concluido',

          data: [
            aCon,
            0,
            0
          ]
        },

        {
          name: 'Remitido',

          data: [
            aRem,
            0,
            0
          ]
        },

        {
          name: 'Desestimado',

          data: [
            0,
            mDes,
            cDes
          ]
        }

      ],

      title: {

        text: titulo,

        style: {
          fontSize: '13px',
          fontWeight: '600'
        }

      }

    };


    this.stackedChart
      ?.updateOptions(
        this.stackedChartOptions
      );

  }


  /* =====================================================
     EVOLUCIÓN MENSUAL
  ===================================================== */

  private actualizarEvolucionMensual(

    alertas: any[],

    maltratos: any[],

    conflictos: any[]

  ): void {


    if (
      this.selectedYear ===
      'all'
    ) {

      this.actualizarUltimosDoceMeses(

        alertas,

        maltratos,

        conflictos

      );

      return;

    }


    const meses = [

      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'

    ];


    const seriesAlerta =
      new Array(12).fill(0);

    const seriesMaltrato =
      new Array(12).fill(0);

    const seriesConflicto =
      new Array(12).fill(0);


    alertas.forEach(
      caso => {

        const date =
          this.getDate(
            caso
          );

        if (date) {

          seriesAlerta[
            date.getMonth()
          ]++;

        }

      }
    );


    maltratos.forEach(
      caso => {

        const date =
          this.getDate(
            caso
          );

        if (date) {

          seriesMaltrato[
            date.getMonth()
          ]++;

        }

      }
    );


    conflictos.forEach(
      caso => {

        const date =
          this.getDate(
            caso
          );

        if (date) {

          seriesConflicto[
            date.getMonth()
          ]++;

        }

      }
    );


    this.actualizarAreaChart(

      meses,

      seriesAlerta,

      seriesMaltrato,

      seriesConflicto,

      `Evolución mensual — ${this.tituloPeriodo}`

    );

  }


  private actualizarUltimosDoceMeses(

    alertas: any[],

    maltratos: any[],

    conflictos: any[]

  ): void {


    const hoy =
      new Date();


    const periodos: {
      year: number;
      month: number;
      label: string;
      key: string;
    }[] = [];


    const nombresMes = [

      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'

    ];


    for (
      let i = 11;
      i >= 0;
      i--
    ) {

      const fecha =
        new Date(
          hoy.getFullYear(),
          hoy.getMonth() - i,
          1
        );


      periodos.push({

        year:
          fecha.getFullYear(),

        month:
          fecha.getMonth(),

        label:
          `${nombresMes[fecha.getMonth()]} ${String(fecha.getFullYear()).slice(-2)}`,

        key:
          `${fecha.getFullYear()}-${fecha.getMonth()}`

      });

    }


    const contar =
      (
        registros: any[]
      ): number[] => {


        const mapa =
          new Map<string, number>();


        registros.forEach(
          caso => {

            const date =
              this.getDate(
                caso
              );


            if (!date) {
              return;
            }


            const key =
              `${date.getFullYear()}-${date.getMonth()}`;


            mapa.set(

              key,

              (
                mapa.get(key) ||
                0
              ) + 1

            );

          }
        );


        return periodos.map(
          periodo =>
            mapa.get(
              periodo.key
            ) || 0
        );

      };


    this.actualizarAreaChart(

      periodos.map(
        periodo =>
          periodo.label
      ),

      contar(alertas),

      contar(maltratos),

      contar(conflictos),

      'Evolución de casos — últimos 12 meses'

    );

  }


  private actualizarAreaChart(

    categories: string[],

    alertas: number[],

    maltratos: number[],

    conflictos: number[],

    titulo: string

  ): void {


    this.areaChartOptions = {

      ...this.areaChartOptions,

      series: [

        {
          name: 'Alerta',
          data: alertas
        },

        {
          name: 'Maltrato',
          data: maltratos
        },

        {
          name: 'Conflicto',
          data: conflictos
        }

      ],

      xaxis: {
        categories
      },

      title: {

        text: titulo,

        style: {
          fontSize: '13px',
          fontWeight: '600'
        }

      }

    };


    this.areaChart
      ?.updateOptions(
        this.areaChartOptions
      );

  }


  /* =====================================================
     CASOS POR INVESTIGADOR
  ===================================================== */

  private actualizarCasosPorInvestigador(

    alertas: any[],

    maltratos: any[],

    conflictos: any[]

  ): void {


    const acumulado =
      new Map<
        string,
        {
          nombre: string;
          cantidad: number;
        }
      >();


    [

      ...alertas,
      ...maltratos,
      ...conflictos

    ].forEach(
      caso => {


        const usuario =
          caso.registradoPor;


        /*
         * Los históricos V2 pueden no
         * tener registradoPor.
         */

        if (
          !usuario ||
          typeof usuario !==
            'object' ||
          !usuario._id
        ) {

          return;

        }


        /*
         * Esta gráfica representa
         * INVESTIGADORES, no registros
         * creados directamente por analistas.
         */

        if (
          usuario.role !==
          'Investigador'
        ) {

          return;

        }


        const id =
          usuario
            ._id
            .toString();


        const actual =
          acumulado.get(
            id
          );


        if (
          actual
        ) {

          actual.cantidad++;

          return;

        }


        acumulado.set(

          id,

          {

            nombre:
              usuario.nombre ||
              'Investigador',

            cantidad: 1

          }

        );

      }
    );


    const datos =
      Array
        .from(
          acumulado.values()
        )
        .sort(
          (a, b) =>
            b.cantidad -
            a.cantidad
        );


    this.investigadoresConRegistros =
      datos.length;


    this.investigatorChartOptions = {

      ...this.investigatorChartOptions,

      series: [

        {
          name: 'Casos',

          data:
            datos.map(
              item =>
                item.cantidad
            )

        }

      ],

      chart: {

        ...this.investigatorChartOptions
          .chart,

        height:
          Math.max(
            300,
            datos.length * 48
          )

      },

      xaxis: {

        categories:
          datos.map(
            item =>
              item.nombre
          )

      },

      title: {

        text:
          `Casos registrados por investigador — ${this.tituloPeriodo}`,

        style: {
          fontSize: '13px',
          fontWeight: '600'
        }

      }

    };


    this.investigatorChart
      ?.updateOptions(
        this.investigatorChartOptions
      );

  }


  /* =====================================================
     FECHAS
  ===================================================== */

  private getDate(
    value: any
  ): Date | null {

    const raw =
      value?.fecha ??
      value?.fechaRegistro ??
      value?.createdAt;


    if (!raw) {

      return null;

    }


    const date =
      new Date(
        raw
      );


    return isNaN(
      date.getTime()
    )
      ? null
      : date;

  }


  private getYear(
    value: any
  ): number | null {

    return (
      this
        .getDate(value)
        ?.getFullYear() ??
      null
    );

  }


  get tituloPeriodo(): string {

    return (
      this.selectedYear ===
      'all'
    )
      ? 'General'
      : `Año ${this.selectedYear}`;

  }


  /* =====================================================
     SESIÓN
  ===================================================== */

  private iniciarContadorSesion():
    void {

    this.actualizarContadorSesion();


    this.sessionTimerId =
      setInterval(
        () =>
          this.actualizarContadorSesion(),
        1000
      );

  }


  private actualizarContadorSesion():
    void {

    const expiresAt =
      this.authService
        .getSessionExpiresAt();


    if (
      !expiresAt
    ) {

      this.sessionRemainingLabel =
        '--:--';

      this.sessionWarning =
        false;

      return;

    }


    const remainingMs =
      Math.max(
        0,
        expiresAt - Date.now()
      );


    this.sessionWarning =
      remainingMs <=
      5 * 60 * 1000;


    if (
      remainingMs <= 0
    ) {

      this.sessionRemainingLabel =
        'Expirada';

      return;

    }


    const totalSeconds =
      Math.ceil(
        remainingMs / 1000
      );


    const hours =
      Math.floor(
        totalSeconds / 3600
      );


    const minutes =
      Math.floor(
        (
          totalSeconds %
          3600
        ) / 60
      );


    const seconds =
      totalSeconds % 60;


    const mm =
      String(
        minutes
      ).padStart(
        2,
        '0'
      );


    const ss =
      String(
        seconds
      ).padStart(
        2,
        '0'
      );


    this.sessionRemainingLabel =
      hours > 0

        ? `${hours}:${mm}:${ss}`

        : `${mm}:${ss}`;

  }

}
