import { Routes } from '@angular/router';
import { Draft } from '../dashboard/draft/draft';
import { Trade } from '../dashboard/trade/trade';
import { League } from '../dashboard/league/league';
import { Home } from '../dashboard/home/home';
import { Team } from '../dashboard/team/team'; 
export const routes: Routes = [
    { path: 'draft', component: Draft },
    { path: 'trade', component: Trade  },
    { path: 'league', component: League  },
    { path: 'home', component: Home },
    { path: 'team', component: Team },
];
