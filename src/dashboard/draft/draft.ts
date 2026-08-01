import { Component, computed, inject, OnInit } from '@angular/core';
import { DraftHub, DraftStatus } from '../../services/Hub/draftHub';
import { GlobalStore } from '../../store/globalStore';
import { SharedModule } from '../../app/app.module';
import { DraftHeader } from './draft-header/draft-header';
import { DraftBoard } from './draft-board/draft-board';
import { DraftListPlayers } from './draft-list-players/draft-list-players';
import { DraftedPlayers } from './drafted-players/drafted-players';
import { DraftMakeTrade } from './draft-make-trade/draft-make-trade';
export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-draft',
  imports: [SharedModule, DraftHeader, DraftBoard, DraftListPlayers, DraftedPlayers, DraftMakeTrade],          // ← was: MatGridListModule, DraftHeader, DraftBoard, DraftListPlayers, DraftedPlayers
  templateUrl: './draft.html',
  styleUrl: './draft.scss',
})

export class Draft implements OnInit {
  
  public draftHub = inject(DraftHub);
  readonly globalStore = inject(GlobalStore);
  public readonly leagueId = this.globalStore.selectedLeagueId() ?? 0;

  ngOnInit(): void {
    if(!this.leagueId){
      alert('Please select a league to start the draft!');
      return;
    }
    this.draftHub.initialize(this.leagueId); 
  }

  readonly isDraftStarted = computed(() => this.draftHub.draftStatus() === DraftStatus.DraftStarted);

  readonly isDraftEnded = computed(() => this.draftHub.draftStatus() === DraftStatus.DraftEnded);

  // Drives the blocking "Draft Ended" overlay.
  readonly isDraftOver = this.draftHub.isDraftOver;



tiles: Tile[] = [
  {text: 'Draft Which Legaue & Timer', cols: 12, rows: 1, color: '#fb04ff' },
  {text: 'Draft teams which team is next to draft', cols: 4, rows: 9, color: '#222'},   // Use Hex for 'dark'
  {text: 'Current Team that the user have drafterd', cols: 8, rows: 5, color: 'brown'}, 
  {text: 'Trades happening and also make a trade on draft night', cols: 8, rows: 4, color: 'blue'},
  // {text: 'Four', cols: 2, rows: 1, color: 'red'},
];
}
