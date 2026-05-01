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
  imports: [RouterModule, SidenavComponent, MatSidenavModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './dashboard-case.component.html',
  styleUrls: ['./dashboard-case.component.css']
})
export default class DashboardCaseComponent {

  opened = true;
  collapsed = false;
  isHandset = false;

  constructor(private bp: BreakpointObserver) {
    this.bp.observe([Breakpoints.Small, Breakpoints.XSmall, Breakpoints.Handset]).subscribe(r => {
      this.isHandset = r.matches;
      this.opened = !r.matches;
      this.collapsed = false;
    });
  }

  onToggle(drawer: any) {
    if (this.isHandset) {
      drawer.toggle();
    } else {
      this.collapsed = !this.collapsed;
    }
  }
}
