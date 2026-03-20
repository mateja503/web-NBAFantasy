import { Routes } from '@angular/router';
import { Draft } from '../dashboard/draft/draft';
import { Trade } from '../dashboard/trade/trade';

export const routes: Routes = [
    { path: 'draft', component: Draft },
    { path: 'trade', component: Trade  },
    { path: '', component: Draft, pathMatch: 'full' },
];
