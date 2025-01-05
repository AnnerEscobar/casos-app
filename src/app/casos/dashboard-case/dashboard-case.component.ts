import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AddCaseAlertaComponent, } from "../pages/add-case-alerta/add-case-alerta.component";
import { AddCaseMaltratoComponent } from "../pages/add-case-maltrato/add-case-maltrato.component";
import { AddCaseConflictoComponent } from '../pages/add-case-conflicto/add-case-conflicto.component';

@Component({
  selector: 'app-dashboard-case',
  imports: [RouterModule, AddCaseConflictoComponent],
  templateUrl: './dashboard-case.component.html',
  styleUrl: './dashboard-case.component.css'
})
export class DashboardCaseComponent {

}
