import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../app/app.module';
import { TeamService } from '../../services/team-service';
import { UserTeamResponse } from '../../models/team';
import { GlobalStore } from '../../store/globalStore';
import { PlayerTableView } from '../../components/player-table-view/player-table-view';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [SharedModule, PlayerTableView],
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class Team implements OnInit {
  private teamService = inject(TeamService);
  private globalStore = inject(GlobalStore);

  teams = signal<UserTeamResponse[]>([]);
  selectedTeamId = signal<number | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  selectedTeam = computed(() =>
    this.teams().find((t) => t.teamid === this.selectedTeamId()) ?? null
  );

  ngOnInit(): void {
    // The user id comes from GlobalStore rather than localStorage directly — the store
    // already hydrates it from the 'use_store_state' key, so there is one source of truth.
    const userId = this.globalStore.userid();

    if (!userId) {
      this.error.set('You need to be signed in to see your teams.');
      this.loading.set(false);
      return;
    }

    this.teamService.getUserTeams(userId).subscribe({
      next: (teams) => {
        this.teams.set(teams);

        // Open on the team the user picked in the command center, so the page agrees with
        // the rest of the app; fall back to the first team otherwise.
        const active = this.globalStore.selectedTeamId();
        const preselected = teams.find((t) => t.teamid === active) ?? teams[0];
        this.selectedTeamId.set(preselected?.teamid ?? null);

        this.loading.set(false);
      },
      error: () => {
        this.error.set('We could not load your teams. Please try again.');
        this.loading.set(false);
      },
    });
  }

  selectTeam(teamId: number): void {
    this.selectedTeamId.set(teamId);
  }
}
