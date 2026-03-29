import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LeagueService {
  private leagueurl = 'https://localhost:7041/v1/league'

  constructor(private http: HttpClient){}

  // getLeages(): Observable<any[]>{
  //    return this.http.get<any[]>(this.all_league)
  // }

  addleague(data: any): Observable<any>{
    return this.http.post<any>(`${this.leagueurl}/add`, data)
  }
}
