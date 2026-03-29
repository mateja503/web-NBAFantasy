import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { Button } from '../../components/button/button';

@Component({
  selector: 'app-team',
  imports: [MatInputModule, MatFormFieldModule, MatRadioModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class Team {

  form = new FormGroup({
    teamName: new FormControl(''),
  });
  onSubmit() {
    console.log('Submit', this.form.value.teamName);
  }
}
