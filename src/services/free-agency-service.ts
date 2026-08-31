import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Player } from '../models/player';
import { ConfigService } from '../app/core/config/config.service';

@Injectable({ providedIn: 'root' })
export class FreeAgencyService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  private get freeAgencyUrl() {
    return `${this.config.apiBaseUrl}/v1/free-agency`;
  }

  /**
   * Every unowned player in one league's pool.
   *
   * Unlike GET /v1/players, this endpoint returns a **flat, unpaginated** array — there is no
   * `PaginationResponses` envelope to unwrap, so the caller filters and sorts client-side.
   * `team` is always null on these rows by design (a free agent has no fantasy team).
   *
   * The endpoint requires authorization; `authInterceptor` attaches the bearer token, and a
   * `leagueId` of 0 or below is rejected by the server, so callers must resolve a real league
   * before calling.
   */
  getFreeAgents(leagueId: number): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.freeAgencyUrl}/all-players`, {
      params: new HttpParams().set('leagueId', leagueId),
    });
  }
}
