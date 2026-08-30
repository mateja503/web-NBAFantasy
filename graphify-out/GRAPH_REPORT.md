# Graph Report - web-NBAFantasy  (2026-08-30)

## Corpus Check
- Corpus is ~24,096 words - fits in a single context window. You may not need a graph.

## Summary
- 524 nodes · 879 edges · 28 communities (20 shown, 8 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Config, Routing and Guards
- App Shell and Runtime Config
- Angular Build Configuration
- Architecture Decisions
- SignalR Hubs and Trade Model
- Runtime Dependencies
- Trade Feature
- Dev Tooling and Test Deps
- Custom Input and Dialog
- Games Schedule Feature
- SharedModule and Layout Shell
- Draft Room Components
- Home Landing and Image Placeholder
- Chatroom and Trade Board
- Players Browser and Filters
- Draft Player Selection Templates
- My Teams and Leagues
- Button Component
- DraftHub Live State
- Draft Header Controls
- Real-Time Scaling Concerns
- Draft REST Service
- Draft Status Enum
- Button Type Definitions
- Team Selection Component
- Draft Page Entry
- Docker Entrypoint Script
- Coupling Bug Finding

## God Nodes (most connected - your core abstractions)
1. `Trade` - 32 edges
2. `Button` - 23 edges
3. `Trade` - 17 edges
4. `TradeHub` - 17 edges
5. `GlobalStore` - 16 edges
6. `Player` - 15 edges
7. `DraftHub` - 15 edges
8. `SharedModule` - 13 edges
9. `ConfigService` - 13 edges
10. `Players` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Drafted Players Template` --semantically_similar_to--> `PlayerTableView`  [INFERRED] [semantically similar]
  src/dashboard/draft/drafted-players/drafted-players.html → src/components/player-table-view/player-table-view.ts
- `Container-Start Runtime Config (entrypoint.sh + envsubst)` --semantically_similar_to--> `Runtime Configuration (config.json + provideAppInitializer)`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → CLAUDE.md
- `Vitest Test Runner (via @angular/build:unit-test)` --semantically_similar_to--> `Vitest (README ng test entrypoint)`  [INFERRED] [semantically similar]
  CLAUDE.md → README.md
- `Material-to-Custominput Form Migration` --conceptually_related_to--> `Custominput`  [INFERRED]
  src/dashboard/league/league-create.html → src/components/custominput/custominput.ts
- `Trade Board Template` --references--> `TradeHub`  [INFERRED]
  src/dashboard/trade/trade.html → src/services/Hub/tradeHub.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SignalR Horizontal-Scaling Prerequisites** — docs_deployment_sticky_sessions, docs_deployment_redis_backplane, docs_deployment_delta_updates, docs_adr_001_frontend_architecture_evaluation_realtime_scaling, docs_adr_001_frontend_architecture_evaluation_full_state_broadcast [EXTRACTED 1.00]
- **Uniform Auth Enforcement Flow** — claude_auth_flow, claude_signalr_auth_bypass, claude_error_handling, docs_adr_001_frontend_architecture_evaluation_no_auth_wiring, src_header_header_template [INFERRED 0.85]
- **App Shell Composition (chrome + routed content)** — src_index_app_root_shell, src_app_app_shell_layout, src_header_header_template, src_sidebar_sidebar_template, src_footer_footer_template [EXTRACTED 1.00]
- **Draft Room Grid Composition (header, board, available, drafted)** — src_dashboard_draft_draft_template, src_dashboard_draft_draft_header_draft_header_template, src_dashboard_draft_draft_board_draft_board_template, src_dashboard_draft_draft_list_players_draft_list_players_template, src_dashboard_draft_drafted_players_drafted_players_template, src_services_hub_drafthub_drafthub [EXTRACTED 1.00]
- **Surfaces Rendering Player Position + Name Rows** — src_dashboard_draft_draft_list_players_draft_list_players_template, src_dashboard_draft_drafted_players_drafted_players_template, src_dashboard_players_players_template, src_dashboard_team_team_template, src_dashboard_trade_trade_template, src_components_player_table_view_player_table_view_playertableview [INFERRED 0.85]
- **Selected Team/League Context Flow Across Features** — src_dashboard_my_teams_and_leagues_my_teams_and_leagues_template, src_store_globalstore_globalstore, src_dashboard_draft_draft_template, src_dashboard_trade_trade_template, src_dashboard_team_team_template [INFERRED 0.95]

## Communities (28 total, 8 thin omitted)

### Community 0 - "App Config, Routing and Guards"
Cohesion: 0.06
Nodes (35): appConfig, routes, authGuard(), authInterceptor(), GlobalErrorHandler, Injectable, httpErrorInterceptor(), PlayerTableView (+27 more)

### Community 1 - "App Shell and Runtime Config"
Cohesion: 0.05
Nodes (26): App, Component, AppConfig, ConfigService, Injectable, DialogResponse, JoinLeague, Component (+18 more)

### Community 2 - "Angular Build Configuration"
Cohesion: 0.05
Nodes (44): build, serve, test, builder, configurations, defaultConfiguration, options, packageManager (+36 more)

### Community 3 - "Architecture Decisions"
Cohesion: 0.06
Nodes (44): Auth Flow (GlobalStore as single source of auth truth), Multi-Stage Docker Build + nginx SPA Fallback, Dual UI Kits (Angular Material + Bootstrap 5), Centralized HTTP Error Handling, Lazy Route Loading Convention, Domain Model Consolidation under src/models, Real-Time Layer (Hubservice base, DraftHub, ChatHub), Runtime Configuration (config.json + provideAppInitializer) (+36 more)

### Community 4 - "SignalR Hubs and Trade Model"
Cohesion: 0.12
Nodes (10): HubMethods, Trade, TradeStatus, Hubservice, Injectable, TradeBetweenTeams, TradeHub, Injectable (+2 more)

### Community 5 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (33): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/material, @angular/platform-browser (+25 more)

### Community 7 - "Dev Tooling and Test Deps"
Cohesion: 0.07
Nodes (27): @angular/build, @angular/compiler-cli, jsdom, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom (+19 more)

### Community 8 - "Custom Input and Dialog"
Cohesion: 0.13
Nodes (11): Custominput, Component, Input, Output, DialogFormField, DynamicDialog, Component, DynamicDialogConfig (+3 more)

### Community 9 - "Games Schedule Feature"
Cohesion: 0.18
Nodes (8): Games, GameSection, Component, Game, GameTeam, ScheduledGames, GameService, Injectable

### Community 10 - "SharedModule and Layout Shell"
Cohesion: 0.17
Nodes (9): NgModule, APP_COMPONENTS, MATERIAL_MODULES, SharedModule, DashboardItem, Footer, Component, Sidebar (+1 more)

### Community 11 - "Draft Room Components"
Cohesion: 0.20
Nodes (11): DraftBoard, Component, Input, Tile, DraftedPlayers, Component, Input, DraftBoardTeams (+3 more)

### Community 12 - "Home Landing and Image Placeholder"
Cohesion: 0.20
Nodes (8): ImagePlaceholder, Component, FeatureCard, Home, Drop-In Image Path Convention, Shot, Home Landing Template, Component

### Community 13 - "Chatroom and Trade Board"
Cohesion: 0.21
Nodes (7): Chatroom, Chatroom Template, Component, Trade Board Template, Trade Panel Three-State Aside, ChatHub, Injectable

### Community 15 - "Draft Player Selection Templates"
Cohesion: 0.24
Nodes (8): Draft Board Template, Draft Ended Blocking Overlay, DraftListPlayers, Draft Available Players Template, Component, Input, Output, Draft Room Template

### Community 16 - "My Teams and Leagues"
Cohesion: 0.18
Nodes (7): Games Schedule Template, MyTeamsAndLeagues, My Teams And Leagues Template, Component, Draft Filter Buffer (apply/reset), Players Browser Template, My Teams Roster Template

### Community 17 - "Button Component"
Cohesion: 0.20
Nodes (4): Button, Component, Input, Output

### Community 19 - "Draft Header Controls"
Cohesion: 0.25
Nodes (5): DraftHeader, Draft Header Template, Component, Input, Output

### Community 20 - "Real-Time Scaling Concerns"
Cohesion: 0.29
Nodes (7): Full-State Broadcast on Every UpdateDraftState, Real-Time Layer Scaling Question (persistent WebSocket connections), Unbounded Chat Message Array, Delta Updates + Snapshot-on-Resync (planned backend follow-up), MAX_MESSAGES Retained-Chat Cap, Redis SignalR Backplane (AddStackExchangeRedis), Sticky Sessions (session affinity) Requirement

### Community 22 - "Draft Status Enum"
Cohesion: 0.33
Nodes (6): DraftStatus, DraftCompleted, DraftEnded, DraftStarted, Initial, Paused

### Community 23 - "Button Type Definitions"
Cohesion: 0.40
Nodes (4): ButtonIconPosition, ButtonShape, ButtonSize, ButtonVariant

## Ambiguous Edges - Review These
- `App Shell Layout Template (header + sidebar + router-outlet)` → `Footer Template (MDBootstrap boilerplate)`  [AMBIGUOUS]
  src/app/app.html · relation: conceptually_related_to

## Knowledge Gaps
- **104 isolated node(s):** `$schema`, `version`, `packageManager`, `newProjectRoot`, `projectType` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `App Shell Layout Template (header + sidebar + router-outlet)` and `Footer Template (MDBootstrap boilerplate)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Trade` connect `Trade Feature` to `App Config, Routing and Guards`, `SharedModule and Layout Shell`, `SignalR Hubs and Trade Model`, `Chatroom and Trade Board`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `Button` connect `Button Component` to `App Config, Routing and Guards`, `Custom Input and Dialog`, `Games Schedule Feature`, `SharedModule and Layout Shell`, `Home Landing and Image Placeholder`, `Chatroom and Trade Board`, `Draft Player Selection Templates`, `My Teams and Leagues`, `Draft Header Controls`, `Button Type Definitions`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `TradeHub` connect `SignalR Hubs and Trade Model` to `App Config, Routing and Guards`, `Chatroom and Trade Board`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `packageManager` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Config, Routing and Guards` be split into smaller, more focused modules?**
  _Cohesion score 0.06398730830248546 - nodes in this community are weakly interconnected._
- **Should `App Shell and Runtime Config` be split into smaller, more focused modules?**
  _Cohesion score 0.05451127819548872 - nodes in this community are weakly interconnected._