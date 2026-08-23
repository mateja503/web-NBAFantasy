import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HubMethods } from '../../constraints/HubMethods';
import { Trade, TradeStatus } from '../../models/trade';
import { Hubservice } from './hubservice';

/**
 * The SignalR payload shape (NBA.Data.Redis.Entities.TradeBetweenTeams). Deliberately thinner
 * than the REST `Trade`: it carries no status or row id, because every event already says what
 * happened by which method it arrived on.
 */
export interface TradeBetweenTeams {
  tradeId: string; // Guid
  fromTeam: number;
  toTeam: number;
  playersIds: number[];
  /** ISO timestamp. Absent on older payloads, so callers must default it. */
  tradeDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TradeHub extends Hubservice {
  protected override hubUrl = 'tradeHub';
  protected override retryTime = 3000;

  /**
   * Which (league, team) pair the current connection was opened for. The hub subscribes a
   * connection to its groups from the query string at connect time, so changing either means
   * tearing the connection down rather than just re-registering handlers.
   */
  private connectedLeagueId: number | null = null;
  private connectedTeamId: number | null = null;

  /** Offers addressed to *my* team. The draft room's trade panel renders exactly this. */
  incomingTradeRequests = signal<TradeBetweenTeams[]>([]);

  lastAcceptedTrade = signal<TradeBetweenTeams | null>(null);

  /**
   * The whole league's trade board, in the REST `Trade` shape. Lives here rather than in the
   * component so it survives navigating away from /trade and back, and so the live events have
   * somewhere to land while no component is mounted.
   *
   * Seeded by `hydrate()` from GET /v1/trades; kept current by the listeners below.
   */
  leagueTrades = signal<Trade[]>([]);

  /** Lets a view show "live" vs "offline" without reaching into the protected base signal. */
  readonly connected = this.isConnected.asReadonly();

  /**
   * Idempotent: navigating back to the trade page must not stack a second connection (and a
   * second set of handlers) on top of the first. A different league or team is a real change, so
   * that tears the old connection down first.
   */
  public async initialize(leagueId: number, teamId: number): Promise<void> {
    const samePair = this.connectedLeagueId === leagueId && this.connectedTeamId === teamId;

    if (samePair && this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.hubConnection && !samePair) {
      // Errors here are ignored on purpose: a connection that cannot be stopped is already gone,
      // and that must not stop us opening the new one.
      await this.hubConnection.stop().catch(() => undefined);
    }

    this.connectedLeagueId = leagueId;
    this.connectedTeamId = teamId;

    await this.startConnection({ leagueId, teamId });
    this.registerListeners();
  }

  private registerListeners() {
    // A new offer. ProposeSeasonTrade broadcasts to the whole league, so this fires for trades
    // between two other teams too — the board shows them, but only the recipient's own list grows.
    this.hubConnection.on(HubMethods.Server.ReceiveTradeRequest, (trade: TradeBetweenTeams) => {
      this.upsertTrade(this.toTrade(trade, 'pending'));

      if (trade?.toTeam === this.connectedTeamId) {
        this.addIncoming(trade);
      }
    });

    // The connect-time backlog: everything already waiting for this team. Always aimed at us, so
    // nothing to filter here.
    this.hubConnection.on(HubMethods.Server.ReceiveTradeRequests, (trades: TradeBetweenTeams[]) => {
      for (const trade of trades ?? []) {
        this.upsertTrade(this.toTrade(trade, 'pending'));
        this.addIncoming(trade);
      }
    });

    this.hubConnection.on(HubMethods.Server.ReceiveTradeAccepted, (trade: TradeBetweenTeams) => {
      this.lastAcceptedTrade.set(trade);
      this.settle(trade, 'accepted');
    });

    this.hubConnection.on(HubMethods.Server.ReceiveTradeRejected, (trade: TradeBetweenTeams) => {
      this.settle(trade, 'rejected');
    });

    // A team only holds one standing offer to any given team, so a new proposal retires its own
    // predecessor server-side. Without this the old offer would sit on the board as "open" and
    // answering it would fail.
    this.hubConnection.on(HubMethods.Server.ReceiveTradeSuperseded, (trade: TradeBetweenTeams) => {
      this.settle(trade, 'superseded');
    });
  }

  /** Replaces the board with the server's version. Call after loading GET /v1/trades. */
  public hydrate(trades: Trade[]): void {
    this.leagueTrades.set(trades ?? []);
  }

  /**
   * Merges the TradeDto an invoke just returned into the board.
   *
   * The matching broadcast normally does this on its own, so this is belt and braces — but it is
   * the difference between an action the caller performed showing up immediately and appearing to
   * do nothing when the event is dropped (a reconnect mid-call, a backplane hiccup).
   */
  public applyTrade(trade: Trade): void {
    if (!trade?.tradeguid) return;

    this.upsertTrade(trade);

    if (trade.status !== 'pending') {
      this.incomingTradeRequests.update((prev) =>
        prev.filter((t) => t.tradeId !== trade.tradeguid),
      );
    }
  }

  // ---- Server calls ------------------------------------------------------------------------
  // All three resolve with the settled TradeDto and reject with the hub's error, so the caller
  // can tell the user *why* a trade was refused (roster limits, a player no longer owned, an
  // offer someone already answered) instead of logging it and going quiet.

  public proposeSeasonTrade(
    leagueId: number,
    fromTeam: number,
    toTeam: number,
    playersIds: number[],
  ): Promise<Trade> {
    return this.invoke<Trade>(
      HubMethods.Client.ProposeSeasonTrade,
      leagueId,
      fromTeam,
      toTeam,
      playersIds,
    );
  }

  public acceptSeasonTrade(leagueId: number, tradeId: string): Promise<Trade> {
    return this.invoke<Trade>(HubMethods.Client.AcceptSeasonTrade, leagueId, tradeId);
  }

  /** Declining an offer outright, withdrawing your own, and retiring one you counter. */
  public rejectSeasonTrade(leagueId: number, tradeId: string): Promise<Trade> {
    return this.invoke<Trade>(HubMethods.Client.RejectSeasonTrade, leagueId, tradeId);
  }

  // ---- Draft-time trades ---------------------------------------------------------------------
  // Kept for the draft room, which validates against the live DraftState instead of the rosters.

  public proposeTrade = (
    leagueId: number,
    fromTeam: number,
    toTeam: number,
    playersIds: number[],
  ) => {
    this.hubConnection
      .invoke(HubMethods.Client.ProposeTrade, leagueId, fromTeam, toTeam, playersIds)
      .catch((err: unknown) => {
        console.error('Error while invoking ProposeTrade: ' + err);
      });
  };

  public acceptTrade = (leagueId: number, tradeId: string) => {
    this.hubConnection
      .invoke(HubMethods.Client.AcceptTrade, leagueId, tradeId)
      .catch((err: unknown) => {
        console.error('Error while invoking AcceptTrade: ' + err);
      });
  };

  // ---- Internals -----------------------------------------------------------------------------

  /**
   * `hubConnection` is only assigned by `startConnection`, so an invoke before `initialize()` (or
   * after a failed connect) would otherwise throw a bare "cannot read property of undefined".
   */
  private invoke<T>(method: string, ...args: unknown[]): Promise<T> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject(new Error('Not connected to the trade hub. Try again in a moment.'));
    }

    return this.hubConnection.invoke<T>(method, ...args);
  }

  /** The SignalR payload carries no status or row id — the event it arrived on supplies both. */
  private toTrade(trade: TradeBetweenTeams, status: TradeStatus): Trade {
    return {
      tradeid: 0,
      tradeguid: trade.tradeId,
      leagueid: this.connectedLeagueId ?? 0,
      fromteamid: trade.fromTeam,
      toteamid: trade.toTeam,
      playerids: trade.playersIds ?? [],
      status,
      tscreated: trade.tradeDate ?? new Date().toISOString(),
      tsexpires: '',
    };
  }

  /** Keyed on the guid so a re-delivered event (reconnect, backlog replay) updates, not duplicates. */
  private upsertTrade(trade: Trade): void {
    this.leagueTrades.update((trades) => {
      const index = trades.findIndex((t) => t.tradeguid === trade.tradeguid);

      if (index === -1) return [trade, ...trades];

      const next = [...trades];
      // The row already on the board came from REST and knows things the event does not (the real
      // tradeid, the true timestamps), so those are kept and only the event's fields overwrite.
      next[index] = { ...next[index], ...trade, tradeid: next[index].tradeid || trade.tradeid };
      return next;
    });
  }

  /** A settled trade leaves the actionable list and is marked on the board. */
  private settle(trade: TradeBetweenTeams, status: TradeStatus): void {
    if (!trade?.tradeId) return;

    this.leagueTrades.update((trades) =>
      trades.map((t) => (t.tradeguid === trade.tradeId ? { ...t, status } : t)),
    );

    this.incomingTradeRequests.update((prev) => prev.filter((t) => t.tradeId !== trade.tradeId));
  }

  private addIncoming(trade: TradeBetweenTeams): void {
    if (!trade?.tradeId) return;

    this.incomingTradeRequests.update((prev) =>
      prev.some((t) => t.tradeId === trade.tradeId) ? prev : [...prev, trade],
    );
  }
}
