import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidenavComponent } from '../shared/sidenav/sidenav.component';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-dashboard-case',
  imports: [RouterModule, SidenavComponent, CommonModule],
  templateUrl: './dashboard-case.component.html',
  styleUrls: ['./dashboard-case.component.css']
})
export default class DashboardCaseComponent {

  collapsed = false;

  constructor(private bp: BreakpointObserver) {
    this.bp.observe([Breakpoints.Small, Breakpoints.XSmall, Breakpoints.Handset]).subscribe(r => {
      this.collapsed = r.matches;
    });
  }
}
