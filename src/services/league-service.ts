import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { League } from '../models/league';
import { ConfigService } from '../app/core/config/config.service';

// Re-export the canonical model so existing `import { League } from './league-service'`
// references keep working after consolidation.
export type { League };

/** Stats weighting submitted when creating a league. */
export interface CreateLeagueStatsValue {
  points?: number | null;
  assists?: number | null;
  rebounds?: number | null;
  blocks?: number | null;
  steals?: number | null;
  turnovers?: number | null;
  fgMade?: number | null;
  fgMissed?: number | null;
  ftMade?: number | null;
  ftMissed?: number | null;
  threePointersMade?: number | null;
  threePointersMissed?: number | null;
}

/** Payload for creating a league (mirrors the create-league form). */
export interface CreateLeagueRequest {
  leagueName?: string | null;
  leagueType?: number | null;
  draftStyle?: number | null;
  weeksForSeason?: number | null;
  transactionLimit?: number | null;
  typeTransactionLimits?: number | null;
  autoStart?: boolean | null;
  scoringSystem?: number | null;
  statsValue?: CreateLeagueStatsValue;
}

/** Payload for joining an existing league. */
export interface JoinLeagueRequest {
  leagueId: number;
  teamName: string;
  userId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LeagueService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private get leagueurl() { return `${this.config.apiBaseUrl}/v1/league`; }

  getLeagues(): Observable<League[]> {
    return this.http.get<League[]>(this.leagueurl);
  }

  addleague(data: CreateLeagueRequest): Observable<League> {
    return this.http.post<League>(`${this.leagueurl}/add`, data);
  }

  joinLeague(data: JoinLeagueRequest): Observable<unknown> {
    return this.http.post(`${this.leagueurl}/join`, data);
  }
}
