import { Routes } from '@angular/router';
import { Draft } from '../dashboard/draft/draft';
import { Trade } from '../dashboard/trade/trade';
import { LeagueCreate } from '../dashboard/league/league-create';
import { Home } from '../dashboard/home/home';
import { Team } from '../dashboard/team/team';
import { JoinLeague } from '../dashboard/join-league/join-league';
import { Chatroom } from '../dashboard/chatroom/chatroom';
import { MyTeamsAndLeagues } from '../dashboard/my-teams-and-leagues/my-teams-and-leagues';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    { path: 'home', component: Home },
    { path: 'draft', component: Draft, canActivate: [authGuard] },
    { path: 'trade', component: Trade, canActivate: [authGuard] },
    { path: 'league/create', component: LeagueCreate, canActivate: [authGuard] },
    { path: 'league/join', component: JoinLeague, canActivate: [authGuard] },
    { path: 'team', component: Team, canActivate: [authGuard] },
    { path: 'chatroom', component: Chatroom, canActivate: [authGuard] },
    { path: 'my-teams-leagues', component: MyTeamsAndLeagues, canActivate: [authGuard] },
];
