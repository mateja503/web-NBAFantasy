import { Routes } from '@angular/router';
import { Draft } from '../dashboard/draft/draft';
import { Trade } from '../dashboard/trade/trade';
import { League } from '../dashboard/league/league';

export const routes: Routes = [
    { path: 'draft', component: Draft },
    { path: 'trade', component: Trade  },
    { path: 'league', component: League  },
    { path: '', component: Draft, pathMatch: 'full' },
];
