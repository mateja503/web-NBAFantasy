// =============================================================================
// app.module.ts
// =============================================================================
// ⚠️  IMPORTANT — READ BEFORE USING:
//
// You are on Angular 21 with a standalone-first project (no NgModule bootstrap).
// Angular NgModules are NOT removed, but the modern pattern is standalone components.
//
// This file gives you a SHARED MODULE approach — the closest equivalent to the
// "old AppModule" — which lets you stop repeating imports in every component.
//
// HOW IT WORKS:
//   1. This SharedModule declares and RE-EXPORTS everything.
//   2. Each standalone component imports SharedModule ONCE instead of 10 things.
//   3. You still keep `standalone: true` (required in Angular 19+).
//
// TRADE-OFF vs old NgModule (so you can make an informed decision):
//   Old NgModule:   declare once, use everywhere automatically ✅ | worse tree-shaking ❌
//   SharedModule:   import SharedModule once per component ✅ | still one import ✅
//   Standalone:     explicit per-component, best tree-shaking ✅ | verbose ❌
//
// DEVOPS NOTE:
//   Standalone components produce smaller bundles because the Angular compiler
//   can tree-shake unused modules precisely. A SharedModule that re-exports
//   *everything* trades that precision for developer ergonomics — acceptable for
//   a medium-sized app like this, but worth revisiting when you split into lazy-
//   loaded feature modules.
// =============================================================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

// ------ Angular Material ------
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ScrollingModule } from '@angular/cdk/scrolling';

// ------ Shared / Reusable Components ------
import { Button } from '../components/button/button';
import { Custominput } from '../components/custominput/custominput';
import { DynamicDialog } from '../components/dialog/dynamicDialog';

// ------ Layout Components ------
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { Footer } from '../footer/footer';

// ------ Page / Feature Components ------
import { Home } from '../dashboard/home/home';
import { Team } from '../dashboard/team/team';
import { Trade } from '../dashboard/trade/trade';
import { Chatroom } from '../dashboard/chatroom/chatroom';
import { LeagueCreate } from '../dashboard/league/league-create';
import { JoinLeague } from '../dashboard/join-league/join-league';
import { MyTeamsAndLeagues } from '../dashboard/my-teams-and-leagues/my-teams-and-leagues';

// ------ Draft Feature Components ------
import { Draft } from '../dashboard/draft/draft';
import { DraftHeader } from '../dashboard/draft/draft-header/draft-header';
import { DraftBoard } from '../dashboard/draft/draft-board/draft-board';
import { DraftListPlayers } from '../dashboard/draft/draft-list-players/draft-list-players';
import { DraftedPlayers } from '../dashboard/draft/drafted-players/drafted-players';


// -----------------------------------------------------------------------------
// All Angular Material modules collected in one array for readability.
// If you add a new Material component anywhere in the app, add its module here.
// -----------------------------------------------------------------------------
const MATERIAL_MODULES = [
  MatButtonModule,
  MatInputModule,
  MatFormFieldModule,
  MatRadioModule,
  MatIconModule,
  MatDialogModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatGridListModule,
  MatSidenavModule,
  MatExpansionModule,
  MatSelectModule,
  MatSnackBarModule,
  ScrollingModule,
];

// -----------------------------------------------------------------------------
// All your app's components collected in one array.
// When you create a new component, add it here — one place, done.
// -----------------------------------------------------------------------------
const APP_COMPONENTS = [
  // Shared UI
  Button,
  Custominput,
  DynamicDialog,

  // Layout
//   Header,
//   Sidebar,
//   Footer,

  // Pages
//   Home,
//   Team,
//   Trade,
//   Chatroom,
//   LeagueCreate,
//   JoinLeague,
//   MyTeamsAndLeagues,

  // Draft feature
//   Draft,
//   DraftHeader,
//   DraftBoard,
//   DraftListPlayers,
//   DraftedPlayers,
];

@NgModule({
  // 'imports' pulls functionality INTO this module
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    ...MATERIAL_MODULES,
    ...APP_COMPONENTS, // standalone components are imported, not declared
  ],

  // 'exports' makes everything available to whoever imports SharedModule
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    ...MATERIAL_MODULES,
    ...APP_COMPONENTS,
  ],
})
export class SharedModule {}