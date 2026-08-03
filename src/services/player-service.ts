import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Player, PlayersFilter } from '../models/player';
import { ConfigService } from '../app/core/config/config.service';
import { PaginationResponses } from '../models';

export type { Player, PlayersFilter };

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  private get playersUrl() {
    return `${this.config.apiBaseUrl}/v1/players`;
  }

  /**
   * The whole envelope is returned, not just `items` — the Players page pages on the
   * server and needs `totalPages` to render its controls. This endpoint is anonymous,
   * so it works signed out (authInterceptor is a no-op without a token).
   */
  getPlayers(filter: PlayersFilter = {}): Observable<PaginationResponses<Player>> {
    return this.http.get<PaginationResponses<Player>>(this.playersUrl, {
      params: this.toParams(filter),
    });
  }

  /**
   * Serialised generically rather than field by field: PlayersFilter's keys are named to
   * match the API's PlayersFilterSearch parameters exactly, so a new filter only has to be
   * added to the interface. Empty values are dropped so they don't narrow the query.
   */
  private toParams(filter: PlayersFilter): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filter)) {
      if (value === null || value === undefined || value === '') continue;

      if (Array.isArray(value)) {
        // Repeated rather than comma-joined, so the API binds them to a string[].
        for (const item of value) params = params.append(key, item);
        continue;
      }

      params = params.set(key, value as string | number | boolean);
    }

    return params;
  }
}
