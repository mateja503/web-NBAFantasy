import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeagueService } from '../services/league-service';
import { Subscription } from 'rxjs';
import { League } from '../models/league';
import { SharedModule } from './app.module';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';

@Component({
  selector: 'app-root',
  imports: [SharedModule, RouterOutlet, Header, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('web-NBAFantasy');

  subscriptions: Subscription[] = []
  protected leagues = signal<League[]>([]);
  constructor(private leagueService: LeagueService) { }

  ngOnInit(): void {
   this.loadLeagues()
  }


  loadLeagues(){
    //  let subscribe = this.leagueService.getLeages().subscribe({
    //   next: (data: any) => {
    //     console.log('NBA Leagues loaded:', data);
    //     this.leagues.set(data)
    //   },
    //   error: (err: any) => {
    //     console.error('Error fetching leagues', err)
    //   }
    // })
    // this.subscriptions.push(subscribe)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(u=>u.unsubscribe())
  }

}
