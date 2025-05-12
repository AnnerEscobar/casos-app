import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidenavComponent } from '../shared/sidenav/sidenav.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-case',
  imports: [
    RouterModule,
    SidenavComponent,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './dashboard-case.component.html'
})
export default class DashboardCaseComponent {
  events: string[] = [];
  opened: boolean = false;

  constructor(){
    console.log(this.events)
  }


}
