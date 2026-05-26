import { Component, computed, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. Import CommonModule
import { DraftPlayer } from '../../../services/Hub/draftHub';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-draft-list-players',
  standalone: true,                          
  imports: [CommonModule,FormsModule],                  
  templateUrl: './draft-list-players.html',
  styleUrl: './draft-list-players.scss',
})
export class DraftListPlayers {

  private playersSignal = signal<DraftPlayer[]>([]);

  @Input() set draftPlayers(players: DraftPlayer[]) {
    this.playersSignal.set(players);
  }

  public searchQuery = signal<string>('');

  public filteredPlayers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.playersSignal();
    }

    return this.playersSignal().filter(player =>
      player.fullName.toLowerCase().includes(query)
    );

  })

  draftPlayer(playerId: number) {
    console.log(`Drafting player: ${playerId}`);
  }
}