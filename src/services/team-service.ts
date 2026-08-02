import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetLeagueTeamsResponse, UserTeamResponse } from '../models/team';
import { ConfigService } from '../app/core/config/config.service';

// Team now lives in the canonical models folder. Re-exported here so existing
// `import { Team } from './team-service'` references keep resolving.
export type { Team, GetLeagueTeamsResponse, TeamPlayer, UserTeamResponse } from '../models/team';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private get teamUrl() { return `${this.config.apiBaseUrl}/v1/team`; }

  getLeaguesTeams(leagueId: number): Observable<GetLeagueTeamsResponse[]> {
    return this.http.get<GetLeagueTeamsResponse[]>(`${this.teamUrl}/get-leagues-teams/${leagueId}`);
  }

  // Teams owned by the user, each with its roster. The API rejects a userId that doesn't
  // match the one the bearer token was issued for, so this can only ever return your own teams.
  getUserTeams(userId: number): Observable<UserTeamResponse[]> {
    return this.http.get<UserTeamResponse[]>(`${this.teamUrl}/get-user-teams/${userId}`);
  }
}
