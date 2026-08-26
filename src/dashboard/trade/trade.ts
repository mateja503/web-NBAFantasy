import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Button } from '../../components/button/button';
import { Player } from '../../models/player';
import { GetLeagueTeamsResponse } from '../../models/team';
// Aliased: the component below is also called `Trade` (the route imports it by that name).
import { Trade as TradeRow } from '../../models/trade';
import { TradeHub } from '../../services/Hub/tradeHub';
import { TeamService } from '../../services/team-service';
import { TradeService } from '../../services/trade-service';
import { GlobalStore } from '../../store/globalStore';

/** Which slice of the board the list is showing. */
export type TradeFilter = 'open' | 'incoming' | 'outgoing' | 'settled';

/**
 * A trade with both sides resolved to real players and team names, which is all the template
 * needs — a raw Trade is a flat list of ids and says nothing about who gives what.
 */
export interface TradeView {
  trade: TradeRow;
  fromTeamName: string;
  toTeamName: string;
  /** Players leaving the proposing team. */
  gives: Player[];
  /** Players the proposing team is asking for. */
  gets: Player[];
  /** Aimed at my team, and still open — the only case where Accept/Decline apply. */
  isIncoming: boolean;
  /** Proposed by my team, and still open — I can withdraw it, not answer it. */
  isOutgoing: boolean;
  isOpen: boolean;
}

@Component({
  selector: 'app-trade',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './trade.html',
  styleUrl: './trade.scss',
})
export class Trade implements OnInit {
  private tradeService = inject(TradeService);
  private teamService = inject(TeamService);
  private tradeHub = inject(TradeHub);
  private globalStore = inject(GlobalStore);
  private destroyRef = inject(DestroyRef);

  // Read once, not as live signals: the hub connection is opened for this exact pair, so a league
  // switch mid-page would need a reconnect anyway. Switching leagues re-enters the route.
  readonly leagueId = this.globalStore.selectedLeagueId() ?? 0;
  readonly myTeamId = this.globalStore.selectedTeamId() ?? 0;
  readonly leagueName = this.globalStore.selectedLeagueName() ?? '';

  /** Nothing on this page means anything without both — /trade is scoped to one team in one league. */
  readonly hasContext = this.leagueId > 0 && this.myTeamId > 0;

  loading = signal(false);
  error = signal<string | null>(null);
  /** Failures from a hub call (accept/decline/propose), shown next to the action that caused them. */
  actionError = signal<string | null>(null);
  sending = signal(false);

  /** Live board state, owned by the hub so it survives leaving and re-entering the route. */
  readonly trades = this.tradeHub.leagueTrades;
  readonly connected = this.tradeHub.connected;

  teams = signal<GetLeagueTeamsResponse[]>([]);
  /** teamId -> roster. Every league team, because a card can be between two teams that aren't mine. */
  rosters = signal<Record<number, Player[]>>({});

  filter = signal<TradeFilter>('open');
  selectedTradeId = signal<string | null>(null);

  // ---- Offer builder -------------------------------------------------------------------------
  builderOpen = signal(false);
  partnerTeamId = signal<number | null>(null);
  offeredPlayerIds = signal<number[]>([]);
  requestedPlayerIds = signal<number[]>([]);
  /** Set when the builder is answering an offer: that offer is retired once the counter lands. */
  counterOf = signal<TradeRow | null>(null);

  readonly teamNameById = computed<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const team of this.teams()) map[team.teamid] = team.name;
    return map;
  });

  /** Flattened lookup over every roster, so a trade's player ids can be resolved in one pass. */
  readonly playerById = computed<Record<number, Player>>(() => {
    const map: Record<number, Player> = {};
    for (const roster of Object.values(this.rosters())) {
      for (const player of roster) map[player.playerid] = player;
    }
    return map;
  });

  readonly otherTeams = computed(() => this.teams().filter((t) => t.teamid !== this.myTeamId));

  readonly myRoster = computed(() => this.rosters()[this.myTeamId] ?? []);

  readonly partnerRoster = computed(() => {
    const partner = this.partnerTeamId();
    return partner === null ? [] : (this.rosters()[partner] ?? []);
  });

  /** The whole board, newest first, with both sides resolved. */
  readonly tradeViews = computed<TradeView[]>(() =>
    [...this.trades()]
      .sort((a, b) => (b.tscreated ?? '').localeCompare(a.tscreated ?? ''))
      .map((trade) => this.toView(trade)),
  );

  readonly visibleTrades = computed<TradeView[]>(() => {
    const views = this.tradeViews();

    switch (this.filter()) {
      case 'incoming':
        return views.filter((v) => v.isIncoming);
      case 'outgoing':
        return views.filter((v) => v.isOutgoing);
      case 'settled':
        return views.filter((v) => !v.isOpen);
      case 'open':
      default:
        return views.filter((v) => v.isOpen);
    }
  });

  readonly openCount = computed(() => this.tradeViews().filter((v) => v.isOpen).length);
  readonly incomingCount = computed(() => this.tradeViews().filter((v) => v.isIncoming).length);

  /**
   * The offer the panel is showing — resolved against the *visible* list, not the whole board.
   *
   * That is what empties the panel once an offer is settled: accepting or declining drops the card
   * out of every open tab, and a panel still describing it would be the only thing left on screen
   * claiming there is an offer to answer. Scoping it this way also means the Settled tab keeps
   * showing a settled offer when its card is right there in the list, which is the one place
   * reviewing it makes sense.
   */
  readonly selectedTrade = computed<TradeView | null>(() => {
    const id = this.selectedTradeId();
    if (!id) return null;
    return this.visibleTrades().find((v) => v.trade.tradeid === id) ?? null;
  });

  /** Both sides of the offer being built, resolved for the summary line. */
  readonly offeredPlayers = computed(() => this.resolve(this.offeredPlayerIds()));
  readonly requestedPlayers = computed(() => this.resolve(this.requestedPlayerIds()));

  readonly canSend = computed(
    () =>
      this.partnerTeamId() !== null &&
      this.offeredPlayerIds().length + this.requestedPlayerIds().length > 0 &&
      !this.sending(),
  );

  constructor() {
    // An accepted trade moves players between rosters, so every card on the board is now resolving
    // its player ids against stale rosters. Refetching is cheaper than trying to patch them.
    effect(() => {
      const accepted = this.tradeHub.lastAcceptedTrade();
      if (accepted && this.hasContext) this.loadRosters();
    });
  }

  ngOnInit(): void {
    if (!this.hasContext) return;

    // Fire and forget: a failed connection leaves the page working off REST, it just stops
    // updating live. `connected` drives the badge that tells the user which of the two they have.
    this.tradeHub.initialize(this.leagueId, this.myTeamId);

    this.load();
  }

  /** Full reload: the board from REST, the teams and their rosters for resolving it. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      trades: this.tradeService.getLeagueTrades(this.leagueId),
      rosters: this.rosters$(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ trades, rosters }) => {
          this.tradeHub.hydrate(trades ?? []);
          this.rosters.set(rosters);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('We could not load this league’s trades. Please try again.');
          this.loading.set(false);
        },
      });
  }

  private loadRosters(): void {
    this.rosters$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rosters) => this.rosters.set(rosters));
  }

  /**
   * Teams first, then every roster in parallel. The teams come from the API rather than the store
   * cache because the roster fetches need the list *inside* the chain, and the store fills its
   * cache asynchronously with nothing to await.
   *
   * A roster that fails falls back to an empty list instead of failing the whole page: one
   * unreadable team costs you that team's player names, not the trade board.
   */
  private rosters$() {
    return this.teamService.getLeaguesTeams(this.leagueId).pipe(
      switchMap((teams) => {
        this.teams.set(teams ?? []);

        if (!teams?.length) return of<Record<number, Player[]>>({});

        return forkJoin(
          teams.map((team) =>
            this.teamService.getTeamPlayers(team.teamid).pipe(
              catchError(() => of<Player[]>([])),
              map((players) => ({ teamId: team.teamid, players: players ?? [] })),
            ),
          ),
        ).pipe(
          map((entries) => {
            const byTeam: Record<number, Player[]> = {};
            for (const entry of entries) byTeam[entry.teamId] = entry.players;
            return byTeam;
          }),
        );
      }),
    );
  }

  // ---- List ----------------------------------------------------------------------------------

  setFilter(filter: TradeFilter): void {
    this.filter.set(filter);
  }

  selectTrade(view: TradeView): void {
    this.actionError.set(null);
    this.builderOpen.set(false);
    this.selectedTradeId.set(view.trade.tradeid);
  }

  // ---- Actions -------------------------------------------------------------------------------

  accept(view: TradeView): void {
    this.runAction(this.tradeHub.acceptSeasonTrade(this.leagueId, view.trade.tradeid));
  }

  /** Declining an offer aimed at you and withdrawing your own are the same server call. */
  decline(view: TradeView): void {
    this.runAction(this.tradeHub.rejectSeasonTrade(this.leagueId, view.trade.tradeid));
  }

  startNewOffer(): void {
    this.actionError.set(null);
    this.counterOf.set(null);
    this.partnerTeamId.set(null);
    this.offeredPlayerIds.set([]);
    this.requestedPlayerIds.set([]);
    this.selectedTradeId.set(null);
    this.builderOpen.set(true);
  }

  /**
   * Opens the builder pre-filled with the offer being answered, mirrored: what they asked me for
   * becomes what I am offering, and what they put up becomes what I am asking for. That is the
   * same trade seen from my side, so the manager edits a real starting point instead of a blank
   * form.
   */
  startCounter(view: TradeView): void {
    const partner = view.trade.fromteamid === this.myTeamId
      ? view.trade.toteamid
      : view.trade.fromteamid;

    this.actionError.set(null);
    this.counterOf.set(view.trade);
    this.partnerTeamId.set(partner);

    const mine = new Set(this.myRoster().map((p) => p.playerid));
    const theirs = new Set((this.rosters()[partner] ?? []).map((p) => p.playerid));

    this.offeredPlayerIds.set((view.trade.playerids ?? []).filter((id) => mine.has(id)));
    this.requestedPlayerIds.set((view.trade.playerids ?? []).filter((id) => theirs.has(id)));

    this.builderOpen.set(true);
  }

  cancelBuilder(): void {
    this.builderOpen.set(false);
    this.counterOf.set(null);
    this.actionError.set(null);
  }

  selectPartner(teamId: number): void {
    if (this.partnerTeamId() === teamId) return;

    this.partnerTeamId.set(teamId);
    // Players requested from the previous partner are not on this team's roster, so the server
    // would reject them as unowned.
    this.requestedPlayerIds.set([]);
  }

  toggleOffered(playerId: number): void {
    this.offeredPlayerIds.update((ids) =>
      ids.includes(playerId) ? ids.filter((id) => id !== playerId) : [...ids, playerId],
    );
  }

  toggleRequested(playerId: number): void {
    this.requestedPlayerIds.update((ids) =>
      ids.includes(playerId) ? ids.filter((id) => id !== playerId) : [...ids, playerId],
    );
  }

  isOffered(playerId: number): boolean {
    return this.offeredPlayerIds().includes(playerId);
  }

  isRequested(playerId: number): boolean {
    return this.requestedPlayerIds().includes(playerId);
  }

  /**
   * Sends the offer, and — when this is a counter — retires the offer it answers.
   *
   * Order matters: the counter is proposed first, so a proposal the server refuses (roster limits,
   * a player already traded away) leaves the original offer standing. Rejecting first would close
   * an offer and put nothing in its place.
   */
  send(): void {
    const partner = this.partnerTeamId();

    if (partner === null) {
      this.actionError.set('Pick a team to trade with first.');
      return;
    }

    const playerIds = [...this.offeredPlayerIds(), ...this.requestedPlayerIds()];

    if (playerIds.length === 0) {
      this.actionError.set('Put at least one player into the offer.');
      return;
    }

    this.sending.set(true);
    this.actionError.set(null);

    const original = this.counterOf();

    this.tradeHub
      .proposeSeasonTrade(this.leagueId, this.myTeamId, partner, playerIds)
      .then(async (created) => {
        this.tradeHub.applyTrade(created);

        if (original) {
          // A failure here is not fatal: the counter is already on the board, it just leaves the
          // old offer open too. Surfaced rather than swallowed so the manager can withdraw it.
          await this.tradeHub
            .rejectSeasonTrade(this.leagueId, original.tradeid)
            .then((rejected) => this.tradeHub.applyTrade(rejected))
            .catch(() =>
              this.actionError.set(
                'Your counter was sent, but the original offer could not be closed.',
              ),
            );
        }

        this.builderOpen.set(false);
        this.counterOf.set(null);
        this.selectedTradeId.set(created?.tradeid ?? null);
        this.filter.set('outgoing');
      })
      .catch((err: unknown) => this.actionError.set(this.toMessage(err)))
      .finally(() => this.sending.set(false));
  }

  private runAction(action: Promise<TradeRow>): void {
    this.sending.set(true);
    this.actionError.set(null);

    action
      .then((trade) => this.tradeHub.applyTrade(trade))
      .catch((err: unknown) => this.actionError.set(this.toMessage(err)))
      .finally(() => this.sending.set(false));
  }

  // ---- Template helpers ----------------------------------------------------------------------

  teamName(teamId: number): string {
    return this.teamNameById()[teamId] ?? `Team ${teamId}`;
  }

  playerLabel(player: Player): string {
    return `${player.name ?? ''} ${player.surname ?? ''}`.trim() || `#${player.playerid}`;
  }

  positionLabel(player: Player): string {
    return player.position?.trim() || '—';
  }

  /** Local date/time; a blank or unparseable timestamp renders as an em dash, never "Invalid Date". */
  formatDate(value: string | null | undefined): string {
    if (!value) return '—';

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
  }

  statusLabel(trade: TradeRow): string {
    switch (trade.status) {
      case 'pending':
        return 'Open';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Declined';
      case 'superseded':
        return 'Replaced';
      default:
        return trade.status ?? 'Unknown';
    }
  }

  // ---- Internals -----------------------------------------------------------------------------

  private toView(trade: TradeRow): TradeView {
    const { gives, gets } = this.splitSides(trade);
    const isOpen = trade.status === 'pending';

    return {
      trade,
      fromTeamName: this.teamName(trade.fromteamid),
      toTeamName: this.teamName(trade.toteamid),
      gives,
      gets,
      isIncoming: isOpen && trade.toteamid === this.myTeamId,
      isOutgoing: isOpen && trade.fromteamid === this.myTeamId,
      isOpen,
    };
  }

  /**
   * A trade stores both sides in one flat id list, so which side a player is on has to be read off
   * the rosters.
   *
   * The accepted case is inverted deliberately: an accepted trade has already swapped the players,
   * so a player sitting on the proposer's roster *now* is one they received, not one they gave up.
   * Without this, settled trades would render backwards.
   */
  private splitSides(trade: TradeRow): { gives: Player[]; gets: Player[] } {
    const fromRoster = new Set((this.rosters()[trade.fromteamid] ?? []).map((p) => p.playerid));
    const alreadySwapped = trade.status === 'accepted';

    const gives: Player[] = [];
    const gets: Player[] = [];

    for (const player of this.resolve(trade.playerids ?? [])) {
      const onProposer = fromRoster.has(player.playerid);
      const startedWithProposer = alreadySwapped ? !onProposer : onProposer;

      (startedWithProposer ? gives : gets).push(player);
    }

    return { gives, gets };
  }

  /**
   * Ids to players. An id with no roster hit (dropped since, or a team whose roster failed to
   * load) becomes a placeholder rather than vanishing — a trade showing three players when it
   * involves four would be a lie.
   */
  private resolve(ids: number[]): Player[] {
    const lookup = this.playerById();

    return ids.map(
      (id) => lookup[id] ?? ({ playerid: id, name: 'Unknown', surname: `#${id}` } as Player),
    );
  }

  /**
   * NBAExceptionHubFilter serialises `{ ErrorMessage, ErrorCode }` into the HubException message,
   * which SignalR then wraps in its own prose. Pull the real reason back out — "You already have
   * the maximum number of centers" is worth showing; the wrapper is not.
   */
  private toMessage(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err ?? '');

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start !== -1 && end > start) {
      try {
        const parsed = JSON.parse(raw.slice(start, end + 1)) as { ErrorMessage?: string };
        if (parsed?.ErrorMessage) return parsed.ErrorMessage;
      } catch {
        // Not our envelope — fall through to the raw text below.
      }
    }

    return raw || 'Something went wrong. Please try again.';
  }
}
