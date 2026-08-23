import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../app/core/config/config.service';
import { Trade, TradeStatus } from '../models/trade';

export type { Trade, TradeStatus };

@Injectable({ providedIn: 'root' })
export class TradeService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  private get tradesUrl() {
    return `${this.config.apiBaseUrl}/v1/trades`;
  }

  /**
   * Every trade in the league, newest first. This is the trade board's initial load: TradeHub
   * only pushes a client the offers aimed at its own team, and only while it is connected, so
   * without this read the page would show nothing but whatever arrived during this session.
   *
   * Omitting `status` returns the whole history (settled trades included), which is what the
   * board's "Settled" tab renders. The API rejects an unknown status rather than returning [].
   */
  getLeagueTrades(leagueId: number, status?: TradeStatus): Observable<Trade[]> {
    let params = new HttpParams().set('leagueId', leagueId);

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Trade[]>(this.tradesUrl, { params });
  }
}
