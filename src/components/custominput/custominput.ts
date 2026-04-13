import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-custominput',
  imports: [ MatRadioModule,CommonModule, FormsModule, MatLabel, MatFormFieldModule, MatInputModule],
  templateUrl: './custominput.html',
  styleUrl: './custominput.scss',
})
export class Custominput {
@Input() label: string = '';
@Input() type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'email' | 'password' | 'textarea'= 'text';
@Input() required: boolean = false;
@Input() options: {label: string, value: any}[] = [];
@Input() width: undefined | string = '100px';
@Input() appearance: string = 'fill';

@Input() value:any;
@Output() valueChange = new EventEmitter<any>();


onModelChanging(newValue:any){
  this.value = newValue;
  this.valueChange.emit(newValue);
}

get matFormFieldApperance():MatFormFieldAppearance{
  switch(this.appearance){
    case 'fill':
      return "fill"
    default: 
      return "outline"
  }

}


// value: any;

}
