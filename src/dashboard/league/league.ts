import { Component } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

@Component({
  selector: 'app-league',
  imports: [MatInputModule,MatFormFieldModule],
  templateUrl: './league.html',
  styleUrl: './league.scss',
})
export class League {

}
