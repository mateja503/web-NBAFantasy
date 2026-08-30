# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WebNBAFantasy is an Angular 21 single-page app (standalone-first, signals-based) for an NBA fantasy league: team/league management, a live draft room, trades, and chat. It talks to a separate .NET backend over **two transports**: REST/HTTP for CRUD and **SignalR (WebSockets)** for the real-time draft room and chat.

## Commands

```bash
npm start            # ng serve -> dev server at http://localhost:4200 (proxies nothing; backend is separate)
npm run build        # production build to dist/web-NBAFantasy/browser
npm run watch        # dev build, rebuild on change
npm test             # ng test -> Vitest runner
ng test --include src/app/app.spec.ts   # run a single spec file
```

- **Test runner is Vitest** (via `@angular/build:unit-test`), not Karma/Jasmine — despite the `ng test` entrypoint. Test files are `*.spec.ts`.
- Prettier is configured in `package.json` (`printWidth: 100`, `singleQuote: true`). No separate lint script.
- TypeScript is fully strict (`strict`, `strictTemplates`, `noPropertyAccessFromIndexSignature`, etc. in `tsconfig.json`). Avoid `any` at API boundaries — define request/response DTOs.

## Architecture

Layering (see `docs/ADR-001-frontend-architecture-evaluation.md` for the full review — it is the authoritative architecture document and tracks open action items):

- **Presentation** — layout (`src/header`, `src/sidebar`, `src/footer`), feature slices under `src/dashboard/*` (`draft/`, `trade/`, `team/`, `chatroom/`, `league/`, `join-league/`, `home/`, `my-teams-and-leagues/`), shared UI in `src/components/*` (`button`, `custominput`, `dialog`).
- **State** lives in three places — know the rule:
  1. `src/store/globalStore.ts` — `GlobalStore`, an `@ngrx/signals` `signalStore` (`providedIn: 'root'`), **persisted to localStorage** (key `use_store_state`). Holds the logged-in user, JWT, selected team/league, and the user's teams/leagues. **Single source of auth truth** — `isLoggedIn`/`token` are computed signals here.
  2. Signal state **inside the SignalR hub services** (root singletons) — live draft state and chat messages survive component churn here.
  3. Component-local signals.
- **Data access** — HTTP services in `src/services/*` (`auth-service.ts`, `league-service.ts`, `draft-service.ts`, `team-service.ts`); SignalR hub services in `src/services/Hub/*`.
- **Cross-cutting** in `src/app/core/*` — config, auth interceptor + guard, error interceptor + global handler.

### Runtime configuration (do NOT hardcode the API URL)

The backend base URL is **not** baked into the bundle. `ConfigService` (`src/app/core/config/config.service.ts`) fetches `/config.json` via `provideAppInitializer` **before** the app bootstraps; all services read `config.apiBaseUrl`. In Docker, `docker/entrypoint.sh` runs `envsubst` over `config.template.json` at container start, so the **same image** deploys to any environment via `docker run -e API_BASE_URL=...`. Never reintroduce a `localhost:7041` literal in a service.

### Auth flow

- `AuthService.login()` only performs the network call; the caller pipes `UserResponse` into `GlobalStore.loginSuccess()`, which stores the token and flips `isLoggedIn()`.
- `authInterceptor` (`src/app/core/auth/auth.interceptor.ts`) attaches `Authorization: Bearer <token>` to every HttpClient request from `GlobalStore.token()`. Requests without a token (e.g. the boot `/config.json` fetch) pass through.
- `authGuard` (`CanActivateFn`) protects all routes except `/home` (see `src/app/app.routes.ts`).
- **SignalR does NOT pass through HttpClient interceptors.** Hubs authenticate via `accessTokenFactory` in `Hubservice.startConnection` instead.

### Error handling

`httpErrorInterceptor` centralizes HTTP errors: `401` → `GlobalStore.logout()` + redirect to `/home` + snackbar; `0` → "cannot reach server"; `5xx` → generic snackbar. Errors are re-thrown so components can add context-specific handling. `GlobalErrorHandler` catches everything that escapes the RxJS/component layer. Interceptor order in `app.config.ts` matters: `authInterceptor` then `httpErrorInterceptor`.

### Real-time layer (SignalR)

- `Hubservice` (`src/services/Hub/hubservice.ts`) is the abstract base: connection lifecycle, reconnect, URL assembly, `accessTokenFactory` auth. Subclasses set `hubUrl` and `retryTime`.
- `DraftHub` and `ChatHub` extend it. **Server/client method names are centralized in `src/constraints/HubMethods.ts`** — use those constants, never magic strings.
- `DraftHub` currently receives the **entire** `DraftState` on every `UpdateDraftState` event and also owns draft *domain* logic (timer math via a `setInterval`, state mapping). Delta updates are a planned backend follow-up (`docs/DEPLOYMENT.md`).
- `ChatHub` caps retained messages via `MAX_MESSAGES`.

### Routing

All routes are **lazy** (`loadComponent`) for per-feature code-splitting. When adding a feature route, follow the lazy pattern and add `canActivate: [authGuard]` unless it's public.

## Conventions & gotchas

- **Standalone components**, not NgModules. `src/app/app.module.ts` defines a `SharedModule` barrel re-exporting Material + a few components — its retirement in favor of scoped per-component imports is a deferred action item (ADR-001 #3/#6); prefer scoped imports in new components.
- Domain models are being consolidated under `src/models/`. Be aware some types still live next to their service (e.g. `Team` in `team-service.ts`, `League` in `league-service.ts`); prefer the canonical `src/models/` home and avoid creating divergent duplicates.
- Two UI kits are intentionally in use: **Angular Material** and **Bootstrap 5** (+ bootstrap-icons). This is a known, deferred decision (ADR-001 #7) — don't "fix" it by ripping one out.
- Component style language is SCSS; global styles in `src/styles.scss`.

## Deployment

Multi-stage `Dockerfile` (build in `node:20-alpine`, serve from `nginx:alpine` with SPA deep-link fallback in `docker/nginx.conf`). `Jenkinsfile` builds and pushes to Docker Hub. See `docs/DEPLOYMENT.md` for scaling — notably, a multi-instance backend needs **sticky sessions + a Redis SignalR backplane**.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
