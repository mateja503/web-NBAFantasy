import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. Import CommonModule
import { DraftHub, DraftPlayer, TeamDraftBoard } from '../../../services/Hub/draftHub';
import { SharedModule } from '../../../app/app.module';

@Component({
  selector: 'app-draft-list-players',
  standalone: true,
  imports: [SharedModule],
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
  @Input() draftStarted: boolean = false;
  @Output() onPlayerDrafted = new EventEmitter<{leagueId:number,playerId:number, pick:number}>();

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
    if (!this.draftStarted) {
      console.log('Draft has not started yet.');
      return;
    }
    console.log(`Drafting player: ${playerId}`);
    this.onPlayerDrafted.emit({ leagueId: 1, playerId, pick: this.onTheClock?.pick || 0 });
  }
}