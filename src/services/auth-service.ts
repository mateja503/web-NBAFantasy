import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team } from './team-service';
import { League } from './league-service';
import { ConfigService } from '../app/core/config/config.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  token?: string;
  username?: string;
  userid?: number;
  teams: Team[];
  leagues: League[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);

  private get baseUrl() { return `${this.config.apiBaseUrl}/v1/auth`; }

  // Auth state is owned by GlobalStore (single source of truth). This service
  // only performs the network call; the caller pipes the response into
  // GlobalStore.loginSuccess(), which stores the token and flips isLoggedIn().
  login(credentials: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/login`, credentials);
  }
}
