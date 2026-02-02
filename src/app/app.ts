import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Layout } from '../layout/layout';
import { Footer } from '../footer/footer';
import { LeagueService } from '../services/league-service';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Layout, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('web-NBAFantasy');

  subscriptions: Subscription[] = []
  protected leagues = signal<any[]>([]);
  constructor(private leagueService: LeagueService) { }

  ngOnInit(): void {
   this.loadLeagues()
  }


  loadLeagues(){
     let subscribe = this.leagueService.getLeages().subscribe({
      next: (data: any) => {
        console.log('NBA Leagues loaded:', data);
        this.leagues.set(data)
      },
      error: (err: any) => {
        console.error('Error fetching leagues', err)
      }
    })
    this.subscriptions.push(subscribe)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(u=>u.unsubscribe())
  }

}
