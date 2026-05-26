import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. Import CommonModule
import { DraftPlayer } from '../../../services/Hub/draftHub';

@Component({
  selector: 'app-draft-list-players',
  standalone: true,                          // <-- Ensure standalone is true
  imports: [CommonModule],                   // <-- 2. Add CommonModule here
  templateUrl: './draft-list-players.html',
  styleUrl: './draft-list-players.scss',
})
export class DraftListPlayers {
  @Input() draftPlayers: DraftPlayer[] = []; // Now this will map safely from your parent template
  
  draftPlayer(playerId: number) {
    console.log(`Drafting player: ${playerId}`);
  }
}