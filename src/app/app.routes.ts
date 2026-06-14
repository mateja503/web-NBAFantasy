import { Routes } from '@angular/router';
import { Draft } from '../dashboard/draft/draft';
import { Trade } from '../dashboard/trade/trade';
import { LeagueCreate } from '../dashboard/league/league-create';
import { Home } from '../dashboard/home/home';
import { Team } from '../dashboard/team/team';
import { JoinLeague } from '../dashboard/join-league/join-league';
import { Chatroom } from '../dashboard/chatroom/chatroom';
import { MyTeamsAndLeagues } from '../dashboard/my-teams-and-leagues/my-teams-and-leagues';
export const routes: Routes = [
    { path: 'draft', component: Draft },
    { path: 'trade', component: Trade  },
    { path: 'league/create', component: LeagueCreate  },
    { path: 'home', component: Home },
    { path: 'league/join', component: JoinLeague },
    { path: 'team', component: Team },
    { path: 'chatroom', component: Chatroom },
    { path: 'my-teams-leagues', component : MyTeamsAndLeagues },
];
