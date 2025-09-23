import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidenavComponent } from '../shared/sidenav/sidenav.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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




 /*  opened = true;
  collapsed = false;
  isHandset = false;

  constructor(private bp: BreakpointObserver) {
    this.bp.observe([Breakpoints.Small, Breakpoints.Handset]).subscribe(r => {
      this.isHandset = r.matches;
      if (this.isHandset) {

        this.opened = false;
        this.collapsed = false;
      } else {

        this.opened = true;
      }
    });
  }

  onToggle(drawer: any) {
    if (this.isHandset) drawer.toggle();
    else this.collapsed = !this.collapsed;
  } */

}
