import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { Button } from '../../components/button/button';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import { League } from '../../models/league';
import { LeagueService } from '../../services/league-service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-join-league',
  imports: [ReactiveFormsModule,MatInputModule, 
    MatFormFieldModule, MatRadioModule, MatIconModule, Button,
     ReactiveFormsModule,
     MatTableModule,
      MatPaginatorModule
      ],
  templateUrl: './join-league.html',
  styleUrl: './join-league.scss',
})
export class JoinLeague implements OnInit {
  dataSource: any [] = []
  subscriptions: Subscription [] = []
  displayedColumns: string[] = ['name', 'commissioner', 'seasonyear', 'weeksforseason','transactionlimit','autostart', 'typetransactionlimits',
    'typeleague','draftstyle'
  ];

  constructor(private leagueService: LeagueService) {}

  ngOnInit(): void {
    this.loadLeagues()
  }

  joinLeague(row:any){
    console.log('Join league', row)
  }

  loadLeagues(){
   let subscription = this.leagueService.getLeagues().subscribe({
      next: (response) => {
        this.dataSource = response
      }
   })
    this.subscriptions.push(subscription)
  }
  
  
  form = new FormGroup({
    teamName: new FormControl(''),
    leagueId: new FormControl(),
  })

  onSubmit() {
    console.log('Submit join league', this.form.value);
  }

  ngOnDestoy(){
    this.subscriptions.forEach((subscription) => subscription.unsubscribe())
  }
}
