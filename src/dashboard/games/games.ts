import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Game, GameService, ScheduledGames } from '../../services/game-service';

/** One rendered block on the page. The API already returns the three buckets pre-split. */
interface GameSection {
  key: 'today' | 'tomorrow' | 'restOfWeek';
  title: string;
  subtitle: string;
  games: Game[];
}

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './games.html',
  styleUrl: './games.scss',
})
export class Games implements OnInit {
  private gameService = inject(GameService);
  private destroyRef = inject(DestroyRef);

  schedule = signal<ScheduledGames | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Derived rather than stored, so a reload only has to set `schedule`. Every bucket is
  // defaulted to [] because a missing array from the API must render as "no games", not crash.
  readonly sections = computed<GameSection[]>(() => {
    const schedule = this.schedule();

    return [
      {
        key: 'today',
        title: 'Today',
        subtitle: 'Tipping off today',
        games: schedule?.today ?? [],
      },
      {
        key: 'tomorrow',
        title: 'Tomorrow',
        subtitle: "On tomorrow's slate",
        games: schedule?.tomorrow ?? [],
      },
      {
        key: 'restOfWeek',
        title: 'Rest of the week',
        subtitle: 'Through the end of this week, excluding today and tomorrow',
        games: schedule?.restOfWeek ?? [],
      },
    ];
  });

  readonly totalGames = computed(() =>
    this.sections().reduce((count, section) => count + section.games.length, 0),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.gameService
      .getScheduledGames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.schedule.set(response ?? null);
          this.error.set(null);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('We could not load the schedule. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /** "BOS" when the abbreviation is there, otherwise the best name we have. */
  teamShortName(team: Game['homeTeam']): string {
    return team?.abbreviation || team?.fullName || 'TBD';
  }

  teamFullName(team: Game['homeTeam']): string {
    return team?.fullName || 'To be decided';
  }

  /**
   * The API hands back balldontlie's own status label, which is the tip-off time before the game
   * and a clock or "Final" once it is underway. `time` is the fallback when status is blank.
   */
  gameStatus(game: Game): string {
    return game.status?.trim() || game.time?.trim() || 'Scheduled';
  }

  /** Scores only mean something once a game has started; a scheduled matchup shows 0–0. */
  hasScore(game: Game): boolean {
    return (game.homeTeam?.score ?? 0) > 0 || (game.visitorTeam?.score ?? 0) > 0;
  }
}
