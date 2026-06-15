import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, EMPTY, map, Observable, of } from 'rxjs';
import { League } from '../models/league';
import { ConfigService } from '../app/core/config/config.service';
import { PaginationResponses } from '../models';

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
  private get leagueUrl() { return `${this.config.apiBaseUrl}/v1/league`; }


  getLeagues(): Observable<League[]> {
  return this.http.get<PaginationResponses<League>>(this.leagueUrl).pipe(
    map((response) => response.items ?? []),
    catchError((error) => {
      console.error('Failed to fetch leagues', error);
      return EMPTY;//leave it like this for know in the future the error handling should be in one place and not in the service
    })
  );
}

  addleague(data: CreateLeagueRequest): Observable<League> {
    return this.http.post<League>(`${this.leagueUrl}/add`, data);
  }

  joinLeague(data: JoinLeagueRequest): Observable<unknown> {
    return this.http.post(`${this.leagueUrl}/join`, data);
  }
}
