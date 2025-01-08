import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import ApexCharts from 'apexcharts'

@Component({
  selector: 'app-estadistics',
  imports: [
    MatCardModule,
    MatGridListModule,
  ],



  templateUrl: './estadistics.component.html',
  styleUrl: './estadistics.component.css'
})
export default class EstadisticsComponent {

  exps = [{
    tag: 'Alerta Alba-Kenet',
    amount: 20
  },
  {
    tag: 'Casos de Maltrato',
    amount: 24
  },
  {
    tag: 'Casos de Conflicto',
    amount: 24
  },
  {
    tag: 'Remitidos',
    amount: 24
  },
  {
    tag: 'Alertas Activas',
    amount: 24
  },
  {
    tag: 'Alertas Inactivas',
    amount: 24
  }
  ]

}
