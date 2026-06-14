import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Team } from './team-service';
import { ConfigService } from '../app/core/config/config.service';

export interface League {
  leagueid: number;
  name: string;
  commissioner: number;
  seasonyear: string;
  weeksforseason?: number;
  transactionlimit?: number;
  autostart?: boolean;
  typetransactionlimits?: number;
  typeleague?: number;
  draftstyle?: number;
  statsvalueid?: number;
  commissionersTeam?: Team;
}

@Injectable({
  providedIn: 'root',
})
export class LeagueService {
  private config = inject(ConfigService);
  private get leagueurl() { return `${this.config.apiBaseUrl}/v1/league`; }

  constructor(private http: HttpClient){}

  getLeagues(): Observable<League[]>{
     return this.http.get<League[]>(this.leagueurl)
  }

  addleague(data: any): Observable<League>{
    return this.http.post<League>(`${this.leagueurl}/add`, data)
  }

   joinLeague(data: any): Observable<any> {
        return this.http.post<any>(`${this.leagueurl}/join`, data)
    }


}
