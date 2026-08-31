# Graph Report - web-NBAFantasy  (2026-08-31)

## Corpus Check
- 74 files · ~25,647 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 538 nodes · 902 edges · 21 communities (15 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df330e3c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- globalStore.ts
- app.module.ts
- options
- Real-Time Layer (Hubservice base, DraftHub, ChatHub)
- Trade
- dependencies
- Trade
- package.json
- Custominput
- games.ts
- DraftService
- draft.ts
- button.ts
- Injectable
- players.ts
- Button
- Real-Time Layer Scaling Question (persistent WebSocket connections)
- app.config.ts
- entrypoint.sh
- Finding #7: Coupling Bugs (hardcoded leagueId, localStorage token exposure)
- Component

## God Nodes (most connected - your core abstractions)
1. `Trade` - 32 edges
2. `Button` - 24 edges
3. `Player` - 17 edges
4. `Trade` - 17 edges
5. `TradeHub` - 17 edges
6. `GlobalStore` - 17 edges
7. `DraftHub` - 15 edges
8. `ConfigService` - 14 edges
9. `SharedModule` - 13 edges
10. `Players` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Drafted Players Template` --semantically_similar_to--> `PlayerTableView`  [INFERRED] [semantically similar]
  src/dashboard/draft/drafted-players/drafted-players.html → src/components/player-table-view/player-table-view.ts
- `Vitest Test Runner (via @angular/build:unit-test)` --semantically_similar_to--> `Vitest (README ng test entrypoint)`  [INFERRED] [semantically similar]
  CLAUDE.md → README.md
- `Container-Start Runtime Config (entrypoint.sh + envsubst)` --semantically_similar_to--> `Runtime Configuration (config.json + provideAppInitializer)`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → CLAUDE.md
- `Trade Board Template` --references--> `TradeHub`  [INFERRED]
  src/dashboard/trade/trade.html → src/services/Hub/tradeHub.ts
- `Material-to-Custominput Form Migration` --conceptually_related_to--> `Custominput`  [INFERRED]
  src/dashboard/league/league-create.html → src/components/custominput/custominput.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **App Shell Composition (chrome + routed content)** — src_index_app_root_shell, src_app_app_shell_layout, src_header_header_template, src_sidebar_sidebar_template, src_footer_footer_template [EXTRACTED 1.00]
- **Draft Room Grid Composition (header, board, available, drafted)** — src_dashboard_draft_draft_template, src_dashboard_draft_draft_header_draft_header_template, src_dashboard_draft_draft_board_draft_board_template, src_dashboard_draft_draft_list_players_draft_list_players_template, src_dashboard_draft_drafted_players_drafted_players_template, src_services_hub_drafthub_drafthub [EXTRACTED 1.00]
- **SignalR Horizontal-Scaling Prerequisites** — docs_deployment_sticky_sessions, docs_deployment_redis_backplane, docs_deployment_delta_updates, docs_adr_001_frontend_architecture_evaluation_realtime_scaling, docs_adr_001_frontend_architecture_evaluation_full_state_broadcast [EXTRACTED 1.00]
- **Uniform Auth Enforcement Flow** — claude_auth_flow, claude_signalr_auth_bypass, claude_error_handling, docs_adr_001_frontend_architecture_evaluation_no_auth_wiring, src_header_header_template [INFERRED 0.85]
- **Surfaces Rendering Player Position + Name Rows** — src_dashboard_draft_draft_list_players_draft_list_players_template, src_dashboard_draft_drafted_players_drafted_players_template, src_dashboard_players_players_template, src_dashboard_team_team_template, src_dashboard_trade_trade_template, src_components_player_table_view_player_table_view_playertableview [INFERRED 0.85]
- **Selected Team/League Context Flow Across Features** — src_dashboard_my_teams_and_leagues_my_teams_and_leagues_template, src_store_globalstore_globalstore, src_dashboard_draft_draft_template, src_dashboard_trade_trade_template, src_dashboard_team_team_template [INFERRED 0.95]

## Communities (21 total, 6 thin omitted)

### Community 0 - "globalStore.ts"
Cohesion: 0.06
Nodes (31): Component, Injectable, AppConfig, ConfigService, Injectable, FreeAgency, Active Team/League Context Selection, League+Team Context Guard (+23 more)

### Community 1 - "app.module.ts"
Cohesion: 0.06
Nodes (26): NgModule, APP_COMPONENTS, MATERIAL_MODULES, SharedModule, authGuard(), DialogResponse, JoinLeague, Component (+18 more)

### Community 2 - "options"
Cohesion: 0.05
Nodes (44): build, serve, test, builder, configurations, defaultConfiguration, options, packageManager (+36 more)

### Community 3 - "Real-Time Layer (Hubservice base, DraftHub, ChatHub)"
Cohesion: 0.06
Nodes (44): Auth Flow (GlobalStore as single source of auth truth), Multi-Stage Docker Build + nginx SPA Fallback, Dual UI Kits (Angular Material + Bootstrap 5), Centralized HTTP Error Handling, Lazy Route Loading Convention, Domain Model Consolidation under src/models, Real-Time Layer (Hubservice base, DraftHub, ChatHub), Runtime Configuration (config.json + provideAppInitializer) (+36 more)

### Community 4 - "Trade"
Cohesion: 0.16
Nodes (6): Trade, TradeStatus, TradeHub, Injectable, TradeService, Injectable

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/material, @angular/platform-browser (+25 more)

### Community 7 - "package.json"
Cohesion: 0.07
Nodes (27): @angular/build, @angular/compiler-cli, jsdom, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom (+19 more)

### Community 8 - "Custominput"
Cohesion: 0.09
Nodes (16): Custominput, Component, Input, Output, DialogFormField, DynamicDialog, Component, DynamicDialogConfig (+8 more)

### Community 9 - "games.ts"
Cohesion: 0.18
Nodes (8): Games, GameSection, Component, Game, GameTeam, ScheduledGames, GameService, Injectable

### Community 11 - "draft.ts"
Cohesion: 0.07
Nodes (27): HubMethods, DraftBoard, Component, Input, DraftListPlayers, Component, Input, Output (+19 more)

### Community 12 - "button.ts"
Cohesion: 0.13
Nodes (12): ButtonIconPosition, ButtonShape, ButtonSize, ButtonVariant, ImagePlaceholder, Component, FeatureCard, Home (+4 more)

### Community 14 - "players.ts"
Cohesion: 0.13
Nodes (10): AdvancedFilters, cloneAdvanced(), emptyAdvanced(), Players, STAT_FILTERS, StatRange, Component, PlayersFilter (+2 more)

### Community 17 - "Button"
Cohesion: 0.06
Nodes (27): Button, Component, Input, Output, PlayerTableView, Component, Draft Board Template, Draft (+19 more)

### Community 20 - "Real-Time Layer Scaling Question (persistent WebSocket connections)"
Cohesion: 0.29
Nodes (7): Full-State Broadcast on Every UpdateDraftState, Real-Time Layer Scaling Question (persistent WebSocket connections), Unbounded Chat Message Array, Delta Updates + Snapshot-on-Resync (planned backend follow-up), MAX_MESSAGES Retained-Chat Cap, Redis SignalR Backplane (AddStackExchangeRedis), Sticky Sessions (session affinity) Requirement

### Community 21 - "app.config.ts"
Cohesion: 0.13
Nodes (8): App, appConfig, routes, Component, authInterceptor(), GlobalErrorHandler, Injectable, httpErrorInterceptor()

## Ambiguous Edges - Review These
- `App Shell Layout Template (header + sidebar + router-outlet)` → `Footer Template (MDBootstrap boilerplate)`  [AMBIGUOUS]
  src/app/app.html · relation: conceptually_related_to

## Knowledge Gaps
- **104 isolated node(s):** `AdvancedFilters`, `StatRange`, `GlobalState`, `LeagueInStorage`, `TeamInStorage` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `App Shell Layout Template (header + sidebar + router-outlet)` and `Footer Template (MDBootstrap boilerplate)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Trade` connect `Trade` to `globalStore.ts`, `app.module.ts`, `Trade`, `Button`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `Button` connect `Button` to `globalStore.ts`, `app.module.ts`, `Custominput`, `games.ts`, `button.ts`, `players.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `TradeHub` connect `Trade` to `globalStore.ts`, `Button`, `draft.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `AdvancedFilters`, `StatRange`, `GlobalState` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `globalStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06345848757271286 - nodes in this community are weakly interconnected._
- **Should `app.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056261343012704176 - nodes in this community are weakly interconnected._