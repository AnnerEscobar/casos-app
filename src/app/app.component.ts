import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AddCaseComponent } from "./casos/pages/add-case/add-case.component";
import { TypeCaseComponent } from "./casos/components/type-case/type-case.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AddCaseComponent, TypeCaseComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'casos-app';
}
