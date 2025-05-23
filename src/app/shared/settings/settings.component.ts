import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [MatFormFieldModule, MatCardModule, MatSelectModule, MatSlideToggle, MatDividerModule, MatButtonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export default class SettingsComponent {

  constructor(private router: Router){

  }

  goBack(){
    this.router.navigate(['casos/estadisticas']);
  }

}
