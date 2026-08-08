import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../app/core/config/config.service';
import { Game, GameTeam, ScheduledGames } from '../models/game';

export type { Game, GameTeam, ScheduledGames };

@Injectable({ providedIn: 'root' })
export class GameService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  // Getter, not a field: ConfigService is only populated by the app initializer, so reading
  // apiBaseUrl at field-initialisation time would capture an empty string.
  private get gamesUrl() {
    return `${this.config.apiBaseUrl}/v1/games`;
  }

  /**
   * Today's, tomorrow's and the rest of the current week's NBA games, already split into three
   * non-overlapping buckets by the API. This endpoint is anonymous, so it works signed out
   * (authInterceptor is a no-op without a token).
   */
  getScheduledGames(): Observable<ScheduledGames> {
    return this.http.get<ScheduledGames>(this.gamesUrl);
  }
}
