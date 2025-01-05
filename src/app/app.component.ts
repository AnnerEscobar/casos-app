import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardCaseComponent } from "./casos/dashboard-case/dashboard-case.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardCaseComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'casos-app';
}
