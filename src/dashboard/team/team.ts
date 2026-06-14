import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SharedModule } from '../../app/app.module';

@Component({
  selector: 'app-team',
  imports: [SharedModule],
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
