import { Component } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatRadioModule} from '@angular/material/radio' 
@Component({
  selector: 'app-league',
  imports: [MatInputModule,MatFormFieldModule,MatRadioModule],
  templateUrl: './league.html',
  styleUrl: './league.scss',
})
export class League {

}
