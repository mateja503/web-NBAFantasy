import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LeagueService {
  private all_league = 'https://localhost:7041/v1/league/all'

  constructor(private http: HttpClient){}

  getLeages(): Observable<any[]>{
    return this.http.get<any[]>(this.all_league)
  }
}
