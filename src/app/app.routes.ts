import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

// Lazy loadComponent: each feature ships as its own chunk, so a user landing on
// /home no longer downloads the draft room, chat, and SignalR client up front.
// This is the highest-leverage bundle-size win for the SPA.
export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('../dashboard/home/home').then((m) => m.Home),
  },
  {
    // Public on purpose: the player pool is browsable without an account, which is why
    // there is no authGuard here and why GET /v1/players is anonymous on the API.
    path: 'players',
    loadComponent: () => import('../dashboard/players/players').then((m) => m.Players),
  },
  {
    // Public for the same reason as /players: the NBA schedule is public data, which is why
    // there is no authGuard here and why GET /v1/games is anonymous on the API.
    path: 'games',
    loadComponent: () => import('../dashboard/games/games').then((m) => m.Games),
  },
  {
    path: 'draft',
    canActivate: [authGuard],
    loadComponent: () => import('../dashboard/draft/draft').then((m) => m.Draft),
  },
  {
    path: 'trade',
    canActivate: [authGuard],
    loadComponent: () => import('../dashboard/trade/trade').then((m) => m.Trade),
  },
  {
    path: 'league/create',
    canActivate: [authGuard],
    loadComponent: () => import('../dashboard/league/league-create').then((m) => m.LeagueCreate),
  },
  {
    path: 'league/join',
    canActivate: [authGuard],
    loadComponent: () => import('../dashboard/join-league/join-league').then((m) => m.JoinLeague),
  },
  {
    path: 'team',
    canActivate: [authGuard],
    loadComponent: () => import('../dashboard/team/team').then((m) => m.Team),
  },
  {
    // Auth-guarded, unlike /players: GET /v1/free-agency/all-players requires a bearer token
    // and a league id that only a signed-in user's store carries.
    path: 'free-agency',
    canActivate: [authGuard],
    loadComponent: () => import('../dashboard/free-agency/free-agency').then((m) => m.FreeAgency),
  },
  {
    path: 'chatroom',
    canActivate: [authGuard],
    loadComponent: () => import('../dashboard/chatroom/chatroom').then((m) => m.Chatroom),
  },
  {
    path: 'my-teams-leagues',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../dashboard/my-teams-and-leagues/my-teams-and-leagues').then((m) => m.MyTeamsAndLeagues),
  },
];
