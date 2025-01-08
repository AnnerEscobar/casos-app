import { Component } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatListModule} from '@angular/material/list';



@Component({
  selector: 'app-profile',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatGridListModule,
    MatListModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export default class ProfileComponent {


}
