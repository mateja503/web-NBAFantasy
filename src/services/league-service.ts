import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root',
})
export class LeagueService {
  private leagueurl = 'https://localhost:7041/v1/league'

  constructor(private http: HttpClient){}

  getLeagues(): Observable<League[]>{
     return this.http.get<League[]>(this.leagueurl)
  }

  addleague(data: any): Observable<League>{
    return this.http.post<League>(`${this.leagueurl}/add`, data)
  }

 
}
