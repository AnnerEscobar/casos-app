import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AddCaseComponent } from "../pages/add-case/add-case.component";

@Component({
  selector: 'app-dashboard-case',
  imports: [RouterModule, AddCaseComponent],
  templateUrl: './dashboard-case.component.html',
  styleUrl: './dashboard-case.component.css'
})
export class DashboardCaseComponent {

}
