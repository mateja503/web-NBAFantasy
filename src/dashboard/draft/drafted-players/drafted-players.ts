import { Component, Input, OnInit, signal } from '@angular/core';
import { DraftPlayer } from '../../../services/Hub/draftHub';

@Component({
  selector: 'app-drafted-players',
  imports: [],
  templateUrl: './drafted-players.html',
  styleUrl: './drafted-players.scss',
})
export class DraftedPlayers {

  players = signal<DraftPlayer[]>([]);

   @Input() set draftedPlayers(players: DraftPlayer[]) {
    this.players.set(players);
  }

}
