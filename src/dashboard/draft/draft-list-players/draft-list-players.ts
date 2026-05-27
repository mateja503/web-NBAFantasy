import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. Import CommonModule
import { DraftHub, DraftPlayer, TeamDraftBoard } from '../../../services/Hub/draftHub';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-draft-list-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './draft-list-players.html',
  styleUrl: './draft-list-players.scss',
})
export class DraftListPlayers {

  // public draftHub = inject(DraftHub);

  private playersSignal = signal<DraftPlayer[]>([]);

  public selectedPositions = signal<string[]>([]);

  public positions = ['G', 'F', 'C', 'GF', 'CF', 'FG'];

  @Input() set draftPlayers(players: DraftPlayer[]) {
    this.playersSignal.set(players);
  }

  @Input() onTheClock: TeamDraftBoard | null = null;
  @Output() onPlayerDrafted = new EventEmitter<{playerId:number,leagueId:number, pick:number}>();

  public searchQuery = signal<string>('');

  public filteredPlayers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    let players = this.playersSignal();
    let activePositions = this.selectedPositions();

    if (!query && activePositions.length === 0) {
      return players;
    }

    if (activePositions.length > 0) {
      players = players.filter(player =>
        (this.selectedPositions().includes(player.position))
      );
    }

    if (query) {
      players = players.filter(player =>
        player.fullName.toLowerCase().includes(query)
      );
    }

    return players;
  });

  togglePosition(pos: string) {
    const current = this.selectedPositions();
    if (current.includes(pos)) {
      this.selectedPositions.set(current.filter(p => p !== pos));
    } else {
      this.selectedPositions.set([...current, pos]);
    }
  }

  draftPlayer(playerId: number) {
    console.log(`Drafting player: ${playerId}`);
    this.onPlayerDrafted.emit({ playerId, leagueId: 1, pick: this.onTheClock?.pick || 0 });
  }
}