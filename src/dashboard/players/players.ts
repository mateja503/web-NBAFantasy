import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { PlayerService } from '../../services/player-service';
import { Player, PlayersFilter } from '../../models/player';
import { GlobalStore } from '../../store/globalStore';
import { PlayerTableView } from '../../components/player-table-view/player-table-view';

/** One min/max pair, as edited in the filter panel. */
interface StatRange {
  min: number | null;
  max: number | null;
}

/**
 * Everything in the collapsible panel. Held separately from the always-visible search and
 * position pills, because the panel is only committed when the user hits Apply.
 */
interface AdvancedFilters {
  surname: string;
  irlteamname: string;
  irlteamid: number | null;
  allowdrop: boolean | null;
  islock: boolean | null;
  rosterrole: number | null;
  gameready: number | null;
  playermemontoid: number | null;
  tscreatedFrom: string;
  tscreatedTo: string;
  tsupdatedFrom: string;
  tsupdatedTo: string;
  statRanges: Record<string, StatRange>;
}

// `name` is the PlayersFilter suffix ("Points" -> minPoints/maxPoints), so the panel maps
// onto the API's parameters without a lookup table.
const STAT_FILTERS = [
  { key: 'points', name: 'Points', label: 'Points' },
  { key: 'rebounds', name: 'Rebounds', label: 'Rebounds' },
  { key: 'assists', name: 'Assists', label: 'Assists' },
  { key: 'steals', name: 'Steals', label: 'Steals' },
  { key: 'blocks', name: 'Blocks', label: 'Blocks' },
  { key: 'threepointers', name: 'Threepointers', label: '3-Pointers' },
  { key: 'turnovers', name: 'Turnovers', label: 'Turnovers' },
  { key: 'fieldgoal', name: 'Fieldgoal', label: 'Field Goal' },
  { key: 'freethrow', name: 'Freethrow', label: 'Free Throw' },
] as const;

function emptyAdvanced(): AdvancedFilters {
  const statRanges: Record<string, StatRange> = {};
  for (const stat of STAT_FILTERS) statRanges[stat.key] = { min: null, max: null };

  return {
    surname: '',
    irlteamname: '',
    irlteamid: null,
    allowdrop: null,
    islock: null,
    rosterrole: null,
    gameready: null,
    playermemontoid: null,
    tscreatedFrom: '',
    tscreatedTo: '',
    tsupdatedFrom: '',
    tsupdatedTo: '',
    statRanges,
  };
}

function cloneAdvanced(source: AdvancedFilters): AdvancedFilters {
  const statRanges: Record<string, StatRange> = {};
  for (const [key, range] of Object.entries(source.statRanges)) {
    statRanges[key] = { ...range };
  }
  return { ...source, statRanges };
}

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerTableView],
  templateUrl: './players.html',
  styleUrl: './players.scss',
})
export class Players implements OnInit {
  private playerService = inject(PlayerService);
  private destroyRef = inject(DestroyRef);
  // The store hydrates itself from the 'use_store_state' localStorage key, so it is the one
  // source of truth for the signed-in user and their selected league.
  private globalStore = inject(GlobalStore);

  /** The fantasy-team column is for signed-in users only; the rest of the page stays public. */
  readonly showTeamColumn = this.globalStore.isLoggedIn;

  players = signal<Player[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  page = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = signal(0);

  searchQuery = signal('');
  selectedPositions = signal<string[]>([]);

  filtersOpen = signal(false);

  /** Live-edited panel state. `applied` is what the last request actually used. */
  draft: AdvancedFilters = emptyAdvanced();
  private applied = signal<AdvancedFilters>(emptyAdvanced());

  readonly positions = ['G', 'F', 'C', 'GF', 'CF', 'FG'];
  readonly pageSizeOptions = [10, 20, 50];
  readonly statFilters = STAT_FILTERS;

  // Row numbers continue across pages rather than restarting at 1 on every page.
  readonly firstRowNumber = computed(() => (this.page() - 1) * this.pageSize() + 1);

  /** Drives the badge on the Filters button, so a collapsed panel still shows it's active. */
  readonly activeFilterCount = computed(() => {
    const a = this.applied();
    let count = 0;

    if (a.surname) count++;
    if (a.irlteamname) count++;
    if (a.irlteamid !== null) count++;
    if (a.allowdrop !== null) count++;
    if (a.islock !== null) count++;
    if (a.rosterrole !== null) count++;
    if (a.gameready !== null) count++;
    if (a.playermemontoid !== null) count++;
    if (a.tscreatedFrom) count++;
    if (a.tscreatedTo) count++;
    if (a.tsupdatedFrom) count++;
    if (a.tsupdatedTo) count++;

    for (const range of Object.values(a.statRanges)) {
      if (range.min !== null) count++;
      if (range.max !== null) count++;
    }

    return count;
  });

  // Every filter/paging change funnels through one stream: debounce absorbs typing, and
  // switchMap cancels the in-flight request so a slow early response can't overwrite a
  // newer one.
  private readonly reload$ = new Subject<void>();

  ngOnInit(): void {
    this.reload$
      .pipe(
        debounceTime(250),
        switchMap(() => {
          this.loading.set(true);
          return this.playerService.getPlayers(this.buildFilter());
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.players.set(response.items ?? []);
          this.totalCount.set(response.totalCount ?? 0);
          this.totalPages.set(response.totalPages ?? 0);
          this.error.set(null);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('We could not load the players. Please try again.');
          this.loading.set(false);
        },
      });

    this.reload$.next();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.resetToFirstPage();
  }

  togglePosition(pos: string): void {
    const current = this.selectedPositions();
    if (current.includes(pos)) {
      this.selectedPositions.set(current.filter((p) => p !== pos));
    } else {
      this.selectedPositions.set([...current, pos]);
    }
    this.resetToFirstPage();
  }

  toggleFilters(): void {
    this.filtersOpen.set(!this.filtersOpen());
  }

  applyFilters(): void {
    this.applied.set(cloneAdvanced(this.draft));
    this.resetToFirstPage();
  }

  resetFilters(): void {
    this.draft = emptyAdvanced();
    this.applied.set(emptyAdvanced());
    this.searchQuery.set('');
    this.selectedPositions.set([]);
    this.resetToFirstPage();
  }

  changePageSize(size: number): void {
    this.pageSize.set(Number(size));
    this.resetToFirstPage();
  }

  goToPage(page: number): void {
    const last = Math.max(this.totalPages(), 1);
    const target = Math.min(Math.max(page, 1), last);

    if (target === this.page()) return;

    this.page.set(target);
    this.reload$.next();
  }

  private buildFilter(): PlayersFilter {
    const a = this.applied();

    const filter: PlayersFilter = {
      name: this.searchQuery().trim() || undefined,
      playerposition: this.selectedPositions().length ? this.selectedPositions() : undefined,
      surname: a.surname.trim() || undefined,
      irlteamname: a.irlteamname.trim() || undefined,
      irlteamid: a.irlteamid ?? undefined,
      allowdrop: a.allowdrop ?? undefined,
      islock: a.islock ?? undefined,
      rosterrole: a.rosterrole ?? undefined,
      gameready: a.gameready ?? undefined,
      playermemontoid: a.playermemontoid ?? undefined,
      tscreatedFrom: a.tscreatedFrom || undefined,
      tscreatedTo: a.tscreatedTo || undefined,
      tsupdatedFrom: a.tsupdatedFrom || undefined,
      tsupdatedTo: a.tsupdatedTo || undefined,
      // Only meaningful for a signed-in user with a league selected; anonymous visitors send
      // nothing and the API leaves every player's team null.
      leagueId: this.globalStore.selectedLeagueId() ?? undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    };

    // min<Stat>/max<Stat> are assembled by name so adding a stat only means extending
    // STAT_FILTERS — see the note there.
    const indexed = filter as Record<string, unknown>;
    for (const stat of this.statFilters) {
      const range = a.statRanges[stat.key];
      if (range?.min !== null && range?.min !== undefined) indexed[`min${stat.name}`] = range.min;
      if (range?.max !== null && range?.max !== undefined) indexed[`max${stat.name}`] = range.max;
    }

    return filter;
  }

  // A narrower filter can leave the current page past the end of the results, so any
  // filter change starts over at page 1.
  private resetToFirstPage(): void {
    this.page.set(1);
    this.reload$.next();
  }
}
