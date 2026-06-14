import { ChangeDetectorRef, Component, inject, model, Signal, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { League } from '../../models/league';
import { LeagueService } from '../../services/league-service';
import { Observable, Subscription } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { GlobalStore } from '../../store/globalStore';
import { SharedModule } from '../../app/app.module';
import { DynamicDialog } from '../../components/dialog/dynamicDialog';

interface DialogResponse {
  teamName?: string;
}

@Component({
  selector: 'app-join-league',
  imports: [SharedModule, AsyncPipe],
  templateUrl: './join-league.html',
  styleUrl: './join-league.scss',
})
export class JoinLeague {
  private leagueService = inject(LeagueService);
  private subscribers: Subscription[] = [];
  readonly globalStore = inject(GlobalStore);

  leagues$: Observable<League[]> = this.leagueService.getLeagues();

  // Changed from an array signal to a single object/null signal
  selectedLeague = signal<League | null>(null);
  
  displayedColumns: string[] = [
    'name', 'commissioner', 'seasonyear', 'weeksforseason', 
    'transactionlimit', 'autostart', 'typetransactionlimits',
    'typeleague', 'draftstyle'
  ];

  // Refactored to toggle single selection
  selectRow(row: League) {
    console.log('Selected league:', row);
    if (this.selectedLeague()?.leagueid === row.leagueid) {
      this.selectedLeague.set(null); // Deselect if clicked again
    } else {
      this.selectedLeague.set(row); // Select the new league
    }
  }

  readonly name = model('');
  readonly dialog = inject(MatDialog);

  openDialog(): void {
    if (!this.selectedLeague()) return;

    const dialogRef = this.dialog.open(DynamicDialog, {
      width: '550px',
      data: {
        title: 'Enter Team Name',
        description: `Join "${this.selectedLeague()?.name}" with a unique team name. This will be visible to other league members.`,
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

    dialogRef.afterClosed().subscribe((result?: DialogResponse) => {
      console.log('Form Data after the dialog closed', result);
      if (result?.teamName) {
        this.joinLeague(result.teamName);
      }
    });
  }

  // Refactored to map data for a single payload object
  joinLeague(teamName: string) {
    const currentLeague = this.selectedLeague();
    if (!currentLeague) return;

    const data = 
      {
        leagueId: currentLeague.leagueid,
        teamName: teamName,
        userId: this.globalStore.userid() // Replace with actual user ID from auth context
      }
  
    
    console.log('Payload data:', data);

    const subscription = this.leagueService.joinLeague(data).subscribe({
      next: () => {
        alert('League joined successfully');
        this.selectedLeague.set(null);
      },
      error: (error) => {
        alert(`Error while joining league: ${error}`);
      }
    });
    this.subscribers.push(subscription);
  }

  ngOnDestroy() {
    this.selectedLeague.set(null);
    this.subscribers.forEach(u => u.unsubscribe());
  }
}