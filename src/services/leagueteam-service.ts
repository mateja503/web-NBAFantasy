import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LeagueTeamService {
    private leagueTeamUrl = 'https://localhost:7041/v1/league-team'
    constructor(private http: HttpClient) { }

    joinLeague(data: any): Observable<any> {
        return this.http.post<any>(`${this.leagueTeamUrl}/join`, data)
    }

}