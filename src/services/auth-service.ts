import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Team } from './team-service';
import { League } from './league-service';
import { ConfigService } from '../app/core/config/config.service';

export interface UserResponse {
  token?: string;
  username?: string;
  userid?: number;
  teams: Team[];
  leagues: League[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
//   private readonly TOKEN_KEY = 'auth_token';

  private get baseUrl() { return `${this.config.apiBaseUrl}/v1/auth`; }


  // Track auth state
  private currentUserSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.currentUserSubject.asObservable();

  login(credentials: any): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        // localStorage.setItem(this.TOKEN_KEY, response.token);
        // console.log('Login successful:', response);
        this.currentUserSubject.next(true);
      })
    );
  }

  logout(): void {
    // localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(false);
  }


//   getToken(): string | null {
//     return localStorage.getItem(this.TOKEN_KEY);
//   }

//   private hasToken(): boolean {
//     return !!localStorage.getItem(this.TOKEN_KEY);
//   }
}
