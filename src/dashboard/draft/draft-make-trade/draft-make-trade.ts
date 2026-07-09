import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../../app/app.module';
import { TradeHub } from '../../../services/Hub/tradeHub';
import { GlobalStore } from '../../../store/globalStore';
import { DraftPlayer } from '../../../services/Hub/draftHub';
import { GetLeagueTeamsResponse } from '../../../models/team';

@Component({
  selector: 'app-draft-make-trade',
  imports: [SharedModule],
  templateUrl: './draft-make-trade.html',
  styleUrl: './draft-make-trade.scss',
})
export class DraftMakeTrade implements OnInit {
  private tradeHub = inject(TradeHub);
  private globalStore = inject(GlobalStore);

  public readonly leagueId = this.globalStore.selectedLeagueId() ?? 0;
  public readonly myTeamId = this.globalStore.selectedTeamId() ?? 0;

  // Supplied by the parent (Draft) — the drafted players per team.
  private draftedPerTeamSignal = signal<Record<number, DraftPlayer[]>>({});

  @Input() set draftedPlayersPerTeam(players: Record<number, DraftPlayer[]>) {
    this.draftedPerTeamSignal.set(players);
  }

  // The league's teams, cached in the store and fetched from the API on init.
  public leagueTeams = this.globalStore.leagueTeams;

  // Live incoming trade requests owned by the hub.
  public incomingTradeRequests = this.tradeHub.incomingTradeRequests;

  // The offer pool: the logged-in team's drafted players.
  public myPlayers = computed<DraftPlayer[]>(
    () => this.draftedPerTeamSignal()[this.myTeamId] ?? [],
  );

  // Every team in the league except our own — you can't trade with yourself.
  public otherTeams = computed<GetLeagueTeamsResponse[]>(() =>
    this.leagueTeams().filter((team) => team.teamid !== this.myTeamId),
  );

  // The selected trade partner and the players we want back from them.
  public selectedTeamId = signal<number | null>(null);

  public partnerPlayers = computed<DraftPlayer[]>(() => {
    const teamId = this.selectedTeamId();
    if (teamId === null) return [];
    return this.draftedPerTeamSignal()[teamId] ?? [];
  });

  // Player selections on each side of the offer.
  public offeredPlayerIds = signal<number[]>([]);
  public requestedPlayerIds = signal<number[]>([]);

  // Lookups used to render incoming requests (which carry raw ids).
  private teamNameById = computed<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const team of this.leagueTeams()) {
      map[team.teamid] = team.name;
    }
    return map;
  });

  private playerById = computed<Record<number, DraftPlayer>>(() => {
    const map: Record<number, DraftPlayer> = {};
    for (const players of Object.values(this.draftedPerTeamSignal())) {
      for (const player of players) {
        map[player.playerId] = player;
      }
    }
    return map;
  });

  ngOnInit(): void {
    // Fill (or refresh) the league's teams cache before opening the trade hub.
    this.globalStore.ensureLeagueTeams(this.leagueId);
    this.tradeHub.initialize(this.leagueId, this.myTeamId);
  }

  selectTeam(teamId: number): void {
    // Switching partner invalidates any players requested from the previous team.
    this.selectedTeamId.set(teamId);
    this.requestedPlayerIds.set([]);
  }

  toggleOfferedPlayer(playerId: number): void {
    this.offeredPlayerIds.update((ids) =>
      ids.includes(playerId) ? ids.filter((id) => id !== playerId) : [...ids, playerId],
    );
  }

  toggleRequestedPlayer(playerId: number): void {
    this.requestedPlayerIds.update((ids) =>
      ids.includes(playerId) ? ids.filter((id) => id !== playerId) : [...ids, playerId],
    );
  }

  proposeTrade(): void {
    const toTeam = this.selectedTeamId();
    if (toTeam === null) {
      console.log('Select a team to trade with first.');
      return;
    }

    const playersIds = [...this.offeredPlayerIds(), ...this.requestedPlayerIds()];
    if (playersIds.length === 0) {
      console.log('Select at least one player to include in the trade.');
      return;
    }

    this.tradeHub.proposeTrade(this.leagueId, this.myTeamId, toTeam, playersIds);
    this.emptySelections();
  }

  emptySelections(): void {
    this.offeredPlayerIds.set([]);
    this.requestedPlayerIds.set([]);
  }

  acceptTrade(tradeId: string): void {
    this.tradeHub.acceptTrade(this.leagueId, tradeId);
  }

  // Template helpers for the incoming-requests section.
  teamName(teamId: number): string {
    return this.teamNameById()[teamId] ?? `Team ${teamId}`;
  }

  playersForRequest(playerIds: number[]): DraftPlayer[] {
    const map = this.playerById();
    return playerIds.map((id) => map[id]).filter((player): player is DraftPlayer => !!player);
  }
}
