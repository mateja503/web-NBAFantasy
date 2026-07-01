import { signal } from '@angular/core';
import { Injectable } from '@angular/core';
import { HubMethods } from '../../constraints/HubMethods';
import { Hubservice } from './hubservice';

export interface TradeBetweenTeams {
  id: string; // Guid
  fromTeam: number;
  toTeam: number;
  playersIds: number[];
}

@Injectable({
  providedIn: 'root',
})
export class TradeHub extends Hubservice {
  protected override hubUrl = 'tradeHub';
  protected override retryTime = 3000;

  incomingTradeRequests = signal<TradeBetweenTeams[]>([]);
  lastAcceptedTrade = signal<TradeBetweenTeams | null>(null);

  public initialize(leagueId: number, teamId: number) {
    this.startConnection({ leagueId, teamId }).then(() => {
      this.registerListeners();
    });
  }

  private registerListeners() {
    this.hubConnection.on(HubMethods.Server.ReceiveTradeRequest, (trade: TradeBetweenTeams) => {
      this.incomingTradeRequests.update((prev) => [...prev, trade]);
    });

    this.hubConnection.on(HubMethods.Server.ReceiveTradeAccepted, (trade: TradeBetweenTeams) => {
      this.lastAcceptedTrade.set(trade);
      this.incomingTradeRequests.update((prev) => prev.filter((t) => t.id !== trade.id));
    });
  }

  public proposeTrade = (
    leagueId: number,
    fromTeam: number,
    toTeam: number,
    playersIds: number[],
  ) => {
    this.hubConnection
      .invoke(HubMethods.Client.ProposeTrade, leagueId, fromTeam, toTeam, playersIds)
      .then(() => {
        console.log('Propose trade command successfully sent to server');
      })
      .catch((err: any) => {
        console.error('Error while invoking ProposeTrade: ' + err);
      });
  };

  public acceptTrade = (leagueId: number, tradeId: string) => {
    this.hubConnection
      .invoke(HubMethods.Client.AcceptTrade, leagueId, tradeId)
      .then(() => {
        console.log('Accept trade command successfully sent to server');
      })
      .catch((err: any) => {
        console.error('Error while invoking AcceptTrade: ' + err);
      });
  };
}
