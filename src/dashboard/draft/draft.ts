import { Component } from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
 
export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-draft',
  imports: [MatGridListModule],
  templateUrl: './draft.html',
  styleUrl: './draft.scss',
})

export class Draft {
tiles: Tile[] = [
  {text: 'Draft Which Legaue & Timer', cols: 12, rows: 1, color: '#fb04ff' },
  {text: 'Draft teams which team is next to draft', cols: 4, rows: 9, color: '#222'},   // Use Hex for 'dark'
  {text: 'Current Team that the user have drafterd', cols: 8, rows: 5, color: 'brown'}, 
  {text: 'Trades happening and also make a trade on draft night', cols: 8, rows: 4, color: 'blue'},
  // {text: 'Four', cols: 2, rows: 1, color: 'red'},
];
}
