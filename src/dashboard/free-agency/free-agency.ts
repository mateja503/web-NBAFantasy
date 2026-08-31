import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, debounceTime, map, merge, switchMap } from 'rxjs';
import { FreeAgencyService } from '../../services/free-agency-service';
import { Player } from '../../models/player';
import { GlobalStore } from '../../store/globalStore';
import { Button } from '../../components/button/button';

/** Skeleton cards rendered while the pool loads — one row's worth at the widest breakpoint. */
const SKELETON_COUNT = 8;

@Component({
  selector: 'app-free-agency',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Button],
  templateUrl: './free-agency.html',
  styleUrl: './free-agency.scss',
})
export class FreeAgency implements OnInit {
  private freeAgencyService = inject(FreeAgencyService);
  private destroyRef = inject(DestroyRef);
  private globalStore = inject(GlobalStore);

  /** `number | undefined` — undefined whenever the user has not picked a league yet. */
  readonly selectedLeagueId = this.globalStore.selectedLeagueId;
  readonly selectedLeagueName = this.globalStore.selectedLeagueName;

  /** False when there is nothing to query — that is what drives the "pick a league" card. */
  readonly hasLeague = computed(() => (this.selectedLeagueId() ?? 0) > 0);

  players = signal<Player[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  /** Bound straight to the input so typing is never swallowed by the debounce below. */
  searchText = signal('');
  /** The debounced value the filter actually reads. */
  searchQuery = signal('');
  selectedPositions = signal<string[]>([]);

  readonly positions = ['G', 'F', 'C', 'GF', 'CF', 'FG'];
  readonly skeletons = Array.from({ length: SKELETON_COUNT }, (_, i) => i);
  /** Held as a field, not an array literal in the template, so @for keeps a stable identity. */
  readonly skeletonStats = [0, 1, 2, 3, 4, 5];

  /**
   * Filtering is **client-side** here, unlike the Players page: `/free-agency/all-players`
   * returns the league's entire free-agent pool in one unpaginated response, so narrowing it
   * needs no second request. Search matches name or surname; positions are OR'd together.
   */
  readonly filteredPlayers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const positions = this.selectedPositions();

    return this.players().filter((player) => {
      if (positions.length > 0) {
        const position = player.position?.trim().toUpperCase() ?? '';
        if (!positions.includes(position)) return false;
      }

      if (query.length === 0) return true;

      const name = `${player.name ?? ''} ${player.surname ?? ''}`.toLowerCase();
      return name.includes(query);
    });
  });

  readonly totalCount = computed(() => this.players().length);
  readonly filteredCount = computed(() => this.filteredPlayers().length);
  readonly isFiltered = computed(
    () => this.searchQuery().trim().length > 0 || this.selectedPositions().length > 0,
  );

  // Typing re-runs a pure `computed` over an in-memory array, which is cheap, but the debounce
  // still keeps a long pool from being re-filtered on every keystroke.
  private readonly searchInput$ = new Subject<string>();

  // Manual reload trigger for the Retry button.
  private readonly reload$ = new Subject<void>();

  // toObservable over the store signal rather than an `effect`: the reload is an async request
  // that must be cancelled when the league changes mid-flight, and `switchMap` expresses that
  // directly. An `effect` would need its own subscription bookkeeping to avoid a stale response
  // from the previous league overwriting the new one.
  private readonly leagueId$ = toObservable(this.selectedLeagueId);

  ngOnInit(): void {
    this.searchInput$
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => this.searchQuery.set(query));

    merge(this.leagueId$, this.reload$.pipe(map(() => this.selectedLeagueId())))
      .pipe(
        switchMap((leagueId) => {
          // No league selected: the server rejects leagueId <= 0, so nothing is sent and the
          // template shows the "pick a league" card instead.
          if (leagueId === null || leagueId === undefined || leagueId <= 0) {
            this.players.set([]);
            this.error.set(null);
            this.loading.set(false);
            return EMPTY;
          }

          this.loading.set(true);
          this.error.set(null);

          return this.freeAgencyService.getFreeAgents(leagueId).pipe(
            // Caught inside the inner observable so a failed request does not tear down the
            // outer stream — otherwise Retry and league switches would stop working after the
            // first error. httpErrorInterceptor has already snackbarred 401/0/5xx; this only
            // adds the inline message.
            catchError(() => {
              this.error.set('We could not load the free agents. Please try again.');
              this.players.set([]);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((freeAgents) => {
        this.players.set(freeAgents ?? []);
        this.error.set(null);
        this.loading.set(false);
      });
  }

  onSearch(query: string): void {
    const value = query ?? '';
    // The signal the input renders from is set immediately; only the filter input is debounced,
    // so the field never jumps back to a stale value mid-keystroke.
    this.searchText.set(value);
    this.searchInput$.next(value);
  }

  togglePosition(pos: string): void {
    const current = this.selectedPositions();
    if (current.includes(pos)) {
      this.selectedPositions.set(current.filter((p) => p !== pos));
    } else {
      this.selectedPositions.set([...current, pos]);
    }
  }

  retry(): void {
    this.reload$.next();
  }
}
