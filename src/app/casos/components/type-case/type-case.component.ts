import { Component } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';


interface casosType {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-type-case',
  imports: [MatSelectModule, MatButtonModule],
  templateUrl: './type-case.component.html',
  styleUrl: './type-case.component.css'
})

export class TypeCaseComponent {

  casos: casosType[] = [
    {value: 'Alerta Alba-Keneth', viewValue: 'Alba-Keneth'},
    {value: 'Maltrato', viewValue: 'Maltrato'},
    {value: 'Conflicto', viewValue: 'Conflicto'},
  ];

  

}
