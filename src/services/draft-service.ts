import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Team } from './team-service';

export interface DraftRequest{
  leagueId?: number;
  startDraft?: boolean;
}

export interface DraftTeamsResponse{
  round: number;
  teams: Team[]
}

@Injectable({
  providedIn: 'root',
})
export class DraftService {

  private http = inject(HttpClient);
   private draftUrl = 'https://localhost:7041/v1/draft'

  startDraft(data: DraftRequest): Observable<any>{
       return this.http.post(`${this.draftUrl}/start-draft`, data)
  }

  endDraft(data:DraftRequest): Observable<any>{
    return this.http.post(`${this.draftUrl}/end-draft`, data)
  }

  getDraftTeams(leagueId: number): Observable<DraftTeamsResponse>{
    return this.http.get<DraftTeamsResponse>(`${this.draftUrl}/get-draft-teams/${leagueId}`);
  }
}
