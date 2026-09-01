# Graph Report - web-NBAFantasy  (2026-09-02)

## Corpus Check
- 121 files · ~49,297 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 685 nodes · 1396 edges · 40 communities (32 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5284e614`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- trade/trade.ts
- join-league.ts
- options
- Real-Time Layer (Hubservice base, DraftHub, ChatHub)
- trade/trade.spec.ts
- dependencies
- Trade
- package.json
- Trade Board Template
- games.ts
- globalStore.ts
- draftHub.ts
- home.ts
- app.module.ts
- players.ts
- FakeHubConnection
- coverageExclude
- Button
- DraftHub
- options
- Real-Time Layer Scaling Question (persistent WebSocket connections)
- app.routes.ts
- Draft Room Template
- Team
- production
- web-NBAFantasy
- entrypoint.sh
- Finding #7: Coupling Bugs (hardcoded leagueId, localStorage token exposure)
- DraftHeader
- angular.json
- build
- button.ts
- ImagePlaceholder
- DraftListPlayers
- MyTeamsAndLeagues
- DraftStatus
- development
- coverageThresholds
- Footer
- TestHub

## God Nodes (most connected - your core abstractions)
1. `provideConfigStub()` - 35 edges
2. `Trade` - 33 edges
3. `GlobalStore` - 33 edges
4. `Button` - 25 edges
5. `TEST_API_BASE_URL` - 25 edges
6. `makeUserResponse()` - 24 edges
7. `Player` - 22 edges
8. `Trade` - 21 edges
9. `TradeHub` - 19 edges
10. `DraftHub` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Drafted Players Template` --semantically_similar_to--> `PlayerTableView`  [INFERRED] [semantically similar]
  src/dashboard/draft/drafted-players/drafted-players.html → src/components/player-table-view/player-table-view.ts
- `Active Team/League Context Selection` --conceptually_related_to--> `GlobalStore`  [INFERRED]
  src/dashboard/my-teams-and-leagues/my-teams-and-leagues.html → src/store/globalStore.ts
- `Vitest Test Runner (via @angular/build:unit-test)` --semantically_similar_to--> `Vitest (README ng test entrypoint)`  [INFERRED] [semantically similar]
  CLAUDE.md → README.md
- `Container-Start Runtime Config (entrypoint.sh + envsubst)` --semantically_similar_to--> `Runtime Configuration (config.json + provideAppInitializer)`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → CLAUDE.md
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

## Communities (40 total, 8 thin omitted)

### Community 0 - "trade/trade.ts"
Cohesion: 0.07
Nodes (21): AppConfig, ConfigService, Injectable, PlayerTableView, Component, FreeAgency, Component, TradeFilter (+13 more)

### Community 1 - "join-league.ts"
Cohesion: 0.06
Nodes (23): Custominput, Component, Input, Output, DialogFormField, DynamicDialog, Component, DynamicDialogConfig (+15 more)

### Community 2 - "options"
Cohesion: 0.22
Nodes (9): options, assets, browser, inlineStyleLanguage, scripts, styles, node_modules/bootstrap/dist/css/bootstrap.min.css, node_modules/bootstrap-icons/font/bootstrap-icons.css (+1 more)

### Community 3 - "Real-Time Layer (Hubservice base, DraftHub, ChatHub)"
Cohesion: 0.06
Nodes (44): Auth Flow (GlobalStore as single source of auth truth), Multi-Stage Docker Build + nginx SPA Fallback, Dual UI Kits (Angular Material + Bootstrap 5), Centralized HTTP Error Handling, Lazy Route Loading Convention, Domain Model Consolidation under src/models, Real-Time Layer (Hubservice base, DraftHub, ChatHub), Runtime Configuration (config.json + provideAppInitializer) (+36 more)

### Community 4 - "trade/trade.spec.ts"
Cohesion: 0.06
Nodes (22): HubMethods, Chatroom, Component, build(), init(), isOpenTrade(), Trade, TradeStatus (+14 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/material, @angular/platform-browser (+25 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (31): @angular/build, @angular/compiler-cli, jsdom, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom (+23 more)

### Community 8 - "Trade Board Template"
Cohesion: 0.40
Nodes (5): Chatroom Template, Active Team/League Context Selection, League+Team Context Guard, Trade Board Template, Trade Panel Three-State Aside

### Community 9 - "games.ts"
Cohesion: 0.19
Nodes (9): Games, GameSection, load(), Component, Game, GameTeam, ScheduledGames, GameService (+1 more)

### Community 10 - "globalStore.ts"
Cohesion: 0.08
Nodes (37): httpErrorInterceptor(), build(), build(), expectAgentsRequest(), initWith(), selectLeague(), DashboardItem, signInWithOneOfEach() (+29 more)

### Community 11 - "draftHub.ts"
Cohesion: 0.29
Nodes (7): DraftBoard, Component, Input, DraftBoardTeams, DraftPlayer, DraftState, TeamDraftBoard

### Community 12 - "home.ts"
Cohesion: 0.25
Nodes (6): FeatureCard, Home, Shot, HomeInternals, Home Landing Template, Component

### Community 13 - "app.module.ts"
Cohesion: 0.18
Nodes (9): NgModule, APP_COMPONENTS, MATERIAL_MODULES, SharedModule, Draft, Tile, Component, Sidebar (+1 more)

### Community 14 - "players.ts"
Cohesion: 0.12
Nodes (11): AdvancedFilters, cloneAdvanced(), emptyAdvanced(), Players, STAT_FILTERS, StatRange, Component, PaginationResponses (+3 more)

### Community 16 - "coverageExclude"
Cohesion: 0.18
Nodes (11): coverageExclude, src/app/app.module.ts, src/app/app.routes.ts, src/components/dialog/dialogFormField.ts, src/components/dialog/dynamicDialogConfig.ts, src/constraints/**, src/**/*.d.ts, src/main.ts (+3 more)

### Community 17 - "Button"
Cohesion: 0.20
Nodes (4): Button, Component, Input, Output

### Community 19 - "options"
Cohesion: 0.20
Nodes (10): coverage, coverageInclude, coverageReporters, runner, tsConfig, options, html, lcovonly (+2 more)

### Community 20 - "Real-Time Layer Scaling Question (persistent WebSocket connections)"
Cohesion: 0.29
Nodes (7): Full-State Broadcast on Every UpdateDraftState, Real-Time Layer Scaling Question (persistent WebSocket connections), Unbounded Chat Message Array, Delta Updates + Snapshot-on-Resync (planned backend follow-up), MAX_MESSAGES Retained-Chat Cap, Redis SignalR Backplane (AddStackExchangeRedis), Sticky Sessions (session affinity) Requirement

### Community 21 - "app.routes.ts"
Cohesion: 0.12
Nodes (10): App, appConfig, routes, Component, authGuard(), authInterceptor(), GlobalErrorHandler, Injectable (+2 more)

### Community 22 - "Draft Room Template"
Cohesion: 0.28
Nodes (8): Draft Board Template, Draft Ended Blocking Overlay, Draft Available Players Template, Draft Room Template, DraftedPlayers, Drafted Players Template, Component, Input

### Community 23 - "Team"
Cohesion: 0.22
Nodes (7): Games Schedule Template, My Teams And Leagues Template, Draft Filter Buffer (apply/reset), Players Browser Template, Team, My Teams Roster Template, Component

### Community 24 - "production"
Cohesion: 0.25
Nodes (8): serve, production, budgets, buildTarget, outputHashing, builder, configurations, defaultConfiguration

### Community 25 - "web-NBAFantasy"
Cohesion: 0.25
Nodes (8): web-NBAFantasy, style, @schematics/angular:component, prefix, projectType, root, schematics, sourceRoot

### Community 28 - "DraftHeader"
Cohesion: 0.25
Nodes (5): DraftHeader, Draft Header Template, Component, Input, Output

### Community 29 - "angular.json"
Cohesion: 0.29
Nodes (6): packageManager, cli, newProjectRoot, projects, $schema, version

### Community 30 - "build"
Cohesion: 0.29
Nodes (7): build, test, builder, configurations, defaultConfiguration, builder, architect

### Community 31 - "button.ts"
Cohesion: 0.29
Nodes (4): ButtonIconPosition, ButtonShape, ButtonSize, ButtonVariant

### Community 32 - "ImagePlaceholder"
Cohesion: 0.33
Nodes (3): ImagePlaceholder, Component, Drop-In Image Path Convention

### Community 33 - "DraftListPlayers"
Cohesion: 0.33
Nodes (4): DraftListPlayers, Component, Input, Output

### Community 35 - "DraftStatus"
Cohesion: 0.33
Nodes (6): DraftStatus, DraftCompleted, DraftEnded, DraftStarted, Initial, Paused

### Community 36 - "development"
Cohesion: 0.40
Nodes (5): development, buildTarget, extractLicenses, optimization, sourceMap

### Community 37 - "coverageThresholds"
Cohesion: 0.40
Nodes (5): branches, functions, lines, statements, coverageThresholds

## Ambiguous Edges - Review These
- `App Shell Layout Template (header + sidebar + router-outlet)` → `Footer Template (MDBootstrap boilerplate)`  [AMBIGUOUS]
  src/app/app.html · relation: conceptually_related_to

## Knowledge Gaps
- **124 isolated node(s):** `$schema`, `version`, `packageManager`, `newProjectRoot`, `projectType` (+119 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `App Shell Layout Template (header + sidebar + router-outlet)` and `Footer Template (MDBootstrap boilerplate)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Trade` connect `Trade` to `trade/trade.ts`, `Trade Board Template`, `trade/trade.spec.ts`, `app.module.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `Button` connect `Button` to `trade/trade.ts`, `join-league.ts`, `Trade Board Template`, `games.ts`, `home.ts`, `app.module.ts`, `players.ts`, `Draft Room Template`, `Team`, `DraftHeader`, `button.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `GlobalStore` connect `globalStore.ts` to `trade/trade.ts`, `join-league.ts`, `trade/trade.spec.ts`, `Trade Board Template`, `app.module.ts`, `players.ts`, `app.routes.ts`, `Draft Room Template`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `GlobalStore` (e.g. with `Active Team/League Context Selection` and `League+Team Context Guard`) actually correct?**
  _`GlobalStore` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `version`, `packageManager` to the rest of the system?**
  _124 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `trade/trade.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07102040816326531 - nodes in this community are weakly interconnected._