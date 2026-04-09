import { Component, inject, model, signal, } from '@angular/core';
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
import { LeagueTeamService } from '../../services/leagueteam-service';
import { MatDialog } from '@angular/material/dialog';
import { DynamicDialog } from '../../components/dialog/dynamicDialog';


interface DialogResponse{
  teamName?: string
}

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
  private leagueTeamService = inject(LeagueTeamService);
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

      if (this.selectedRows.length + 1 > 12) {
        alert('You can only select up to 12 leagues to join.')
      } else {
        this.selectedRows = [...this.selectedRows, row]
      }
    }
  }
  readonly animal = signal('');
  readonly name = model('');
  readonly dialog = inject(MatDialog);


  openDialog(): void {
    const dialogRef = this.dialog.open(DynamicDialog, {
      width: '550px',
      data: {
        title: 'Enter Team Name',
        description: 'Join league with a unique team name. This will be visible to other league members.',
        fields: [
          { key: 'teamName', label: 'Team Name', placeholder: 'Enter your team name', type: 'text', width: '350px' }
        ],
        submitLabel: 'Join League',
        submitButtonWidth: '150px',
        cancelLabel: 'Cancel',
        cancelButtonWidth: '100px',
        cancelButtonColor: 'gray',
      },
    });

    dialogRef.afterClosed().subscribe((result?:DialogResponse) => {
      console.log('Form Data after the dialog closed', result);
      if(result!==undefined && result!==null){
        this.joinLeagues(result?.teamName);
      }

    });

  }

  joinLeagues(teamName?:string) {

    let data = {
      ...this.selectedRows.map(league => ({
        leagueId: league.leagueid,
        teamName: teamName
      }))
    }

    console.log('This is the data', data);

    // this.leagueTeamService.joinLeague(this.selectedRows).subscribe({
    //   next: (response) => {
    //       console.log('Leagues joined successfully', response);
    //   },error: (error) => {
    //       console.error('Error joining leagues', error);
    //   }
    // })

  }

  ngOnDestroy() {
    this.selectedRows = [];
  }
}
