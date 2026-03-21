import { Component } from '@angular/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatRadioModule} from '@angular/material/radio' 
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-home',
  imports: [MatInputModule,MatFormFieldModule,MatRadioModule,MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
