import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { routes } from '../../app.routes';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-sidenav',
  imports: [
    MatListModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {


  public menuItems = routes
    .map(route => route.children ?? [])
    .flat()
    .filter(route => route && route.path)
    .filter(route => !route.path?.includes(':'));

}
