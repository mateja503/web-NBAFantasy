import { Component, inject, } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { Button } from '../../components/button/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { League } from '../../models/league';
import { LeagueService } from '../../services/league-service';
import { Observable, Subscription } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: 'app-join-league',
  imports: [ReactiveFormsModule, MatInputModule,
    MatFormFieldModule, MatRadioModule, MatIconModule, Button,
    ReactiveFormsModule, AsyncPipe,
    MatTableModule,
    MatPaginatorModule, ScrollingModule
  ],
  templateUrl: './join-league.html',
  styleUrl: './join-league.scss',
})
export class JoinLeague {

  private leagueService = inject(LeagueService);
  leagues$: Observable<League[]> = this.leagueService.getLeagues()

  selectedRows: any[] = []
  displayedColumns: string[] = ['name', 'commissioner', 'seasonyear', 'weeksforseason', 'transactionlimit', 'autostart', 'typetransactionlimits',
    'typeleague', 'draftstyle'
  ];

  selectRow(row: any) {
    console.log('Join league', row)
    if (this.selectedRows.includes(row)) {
      this.selectedRows = this.selectedRows.filter(r => r !== row)
    } else {
      this.selectedRows = [...this.selectedRows, row]
    }
  }

  form = new FormGroup({
    teamName: new FormControl(''),
    leagueId: new FormControl(),
  })

  onSubmit() {
    console.log('Submit join league', this.form.value);
    console.log('This are the leagues submited for joining', this.selectedRows);
  }

  ngOnDestroy() {
    this.selectedRows = [];
  }
}
