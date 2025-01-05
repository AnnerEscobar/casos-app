import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidenavComponent } from '../shared/sidenav/sidenav.component';
import {MatSidenavModule} from '@angular/material/sidenav';

@Component({
  selector: 'app-dashboard-case',
  imports: [
    RouterModule,
    SidenavComponent,
    MatSidenavModule
  ],
  templateUrl: './dashboard-case.component.html'
})
export default class DashboardCaseComponent {

}
