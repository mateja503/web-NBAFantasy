import { Component, OnInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio'
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../../components/button/button';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LeagueService } from '../../services/league-service';
@Component({
  selector: 'app-league',
  imports: [MatInputModule, MatFormFieldModule, MatRadioModule, MatIconModule, Button, ReactiveFormsModule],
  templateUrl: './league.html',
  styleUrl: './league.scss',
})
export class League implements OnInit {

  constructor(private leagueService: LeagueService) { }

  ngOnInit(): void {
  }

  subscriptions: Subscription[] = []

  form = new FormGroup({
    leagueName: new FormControl(''),
    leagueType: new FormControl(),
    draftStyle: new FormControl(),
    weeksForSeason: new FormControl(),
    transactionLimit: new FormControl(),
    typeTransactionsLimit: new FormControl(),
    autoStartPlayer: new FormControl(true),
    scoringSystem: new FormControl(),
    points: new FormControl(),
    assists: new FormControl(),
    rebounds: new FormControl(),
    blocks: new FormControl(),
    steals: new FormControl(),
    turnovers: new FormControl(),
    fgMade: new FormControl(),
    fgMissed: new FormControl(),
    ftMade: new FormControl(),
    ftMissed: new FormControl(),
    threePointsMade: new FormControl(),
    threePointsMissed: new FormControl(),
  })

  onSubmit() {
    console.log('Submit League Form', this.form.value);

    let data = {
      leagueName: this.form.value.leagueName,
      leagueType: this.form.value.leagueType,
      draftStyle: this.form.value.draftStyle,
      weeksForSeason: this.form.value.weeksForSeason,
      transactionLimit: this.form.value.transactionLimit,
      typeTransactionLimits: this.form.value.typeTransactionsLimit,
      autoStart: this.form.value.autoStartPlayer,
      scoringSystem: this.form.value.scoringSystem,
      statsValue: {
        points: this.form.value.points,
        assists: this.form.value.assists,
        rebounds: this.form.value.rebounds,
        blocks: this.form.value.blocks,
        steals: this.form.value.steals,
        turnovers: this.form.value.turnovers,
        fgMade: this.form.value.fgMade,
        fgMissed: this.form.value.fgMissed,
        ftMade: this.form.value.ftMade,
        ftMissed: this.form.value.ftMissed,
        threePointersMade: this.form.value.threePointsMade,
        threePointersMissed: this.form.value.threePointsMissed,
      }
    }

    let subscribtion = this.leagueService.addleague(data).subscribe({
      next: (data: any) => {
        console.log('League created successfully', data);
      },
      error: (err: any) => {
        console.error('Error creating league', err)
      }
    })
    this.subscriptions.push(subscribtion);
  }

  ngDestroy(): void {
    this.subscriptions.forEach(u => u.unsubscribe())
  }
}
