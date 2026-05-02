import { Component, inject, OnInit } from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
import { DraftHeader } from './draft-header/draft-header';
import { DraftHub } from '../../services/Hub/draftHub';
export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-draft',
  imports: [MatGridListModule, DraftHeader],
  templateUrl: './draft.html',
  styleUrl: './draft.scss',
})

export class Draft implements OnInit {
  
  public draftHub = inject(DraftHub);

  ngOnInit(): void {
    this.draftHub.initialize(1); 
  }

tiles: Tile[] = [
  {text: 'Draft Which Legaue & Timer', cols: 12, rows: 1, color: '#fb04ff' },
  {text: 'Draft teams which team is next to draft', cols: 4, rows: 9, color: '#222'},   // Use Hex for 'dark'
  {text: 'Current Team that the user have drafterd', cols: 8, rows: 5, color: 'brown'}, 
  {text: 'Trades happening and also make a trade on draft night', cols: 8, rows: 4, color: 'blue'},
  // {text: 'Four', cols: 2, rows: 1, color: 'red'},
];
}
