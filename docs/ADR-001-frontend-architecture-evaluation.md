# ADR-001: Evaluation of the WebNBAFantasy Frontend Architecture

**Status:** Proposed (evaluation — no decision committed yet)
**Date:** 2026-06-14
**Deciders:** mateja (solo dev / owner)
**Scope:** System design & architecture review of the Angular 21 SPA and how its components, API layer, real-time layer, and data/state layers interact. Question driving this review: *does the macro-structure hold up under load and maintain proper separation of concerns?*

---

## Context

WebNBAFantasy is a single-page Angular 21 application (standalone-first) that talks to a .NET backend over two transports:

- **REST/HTTP** for CRUD-style operations (`auth`, `league`, `draft`, `team`).
- **SignalR (WebSockets)** for two real-time features: the live draft room (`draftHub`) and chat (`chatHub`).

State lives in an NgRx `signalStore` (`GlobalStore`, persisted to `localStorage`), plus per-feature signal state held inside the SignalR hub services. The UI is built on a mix of Angular Material and Bootstrap 5. The app ships as a static bundle inside a multi-stage Docker image served by nginx, built and pushed to Docker Hub by a Jenkins pipeline.

The stack itself is modern and well-chosen. This review is therefore not about *technology selection* — it's about how the pieces are *wired together*, where the seams leak, and which of those seams will hurt first as the app and its user base grow. Everything below is graded against a "would this survive a junior→senior code review at a product company" bar, since that's your stated growth goal.

### Current layering (as built)

```
┌──────────────────────────────────────────────────────────┐
│  Presentation:  layout (header/sidebar/footer)            │
│                 features (dashboard/draft, /trade, /team…) │
│                 shared UI (button, custominput, dialog)    │
├──────────────────────────────────────────────────────────┤
│  State:         GlobalStore (NgRx signals + localStorage)  │
│                 + signal state inside Hub services         │
│                 + component-local signals                  │
├──────────────────────────────────────────────────────────┤
│  Data access:   HTTP services (auth/league/draft/team)     │
│                 SignalR hub services (draftHub/chatHub)     │
│                 → abstract Hubservice base class            │
├──────────────────────────────────────────────────────────┤
│  Cross-cutting: ❌ no interceptor  ❌ no route guards       │
│                 ❌ no env config    ❌ no error handler      │
└──────────────────────────────────────────────────────────┘
        │ REST https://localhost:7041/v1/*  │ WS https://localhost:7041/*Hub
        ▼                                    ▼
                     .NET backend
```

The layer *names* are right. The problem is that the cross-cutting row is empty, and a few responsibilities have leaked across the boundaries.

---

## What holds up well

Before the critique, the parts of the macro-structure that are genuinely sound and worth keeping:

- **Modern Angular foundation.** Standalone components, signals, and `@ngrx/signals` are the current-generation patterns. You're not carrying legacy `NgModule` bootstrap baggage.
- **Feature-centric folder slicing.** `dashboard/draft/*` groups the draft board, header, player list, and drafted-players into a cohesive vertical slice with a `draft.ts` orchestrator. This is the right instinct and scales well.
- **Abstract `Hubservice` base class.** Connection lifecycle, reconnect, and URL assembly are factored into a reusable base that `DraftHub` and `ChatHub` extend. Good DRY reuse for the real-time layer.
- **`HubMethods` constants.** Server/client method names are centralized instead of scattered magic strings — this is exactly the kind of contract file a senior would expect.
- **Strict TypeScript + strict templates** are enabled in `tsconfig.json`. The guardrails are on (even if `any` is used to escape them in places — see below).
- **Multi-stage Docker build.** Build in `node:20-alpine`, serve the static output from `nginx:alpine`. Correct pattern — the runtime image carries no Node toolchain.

---

## Findings — separation of concerns

### 1. Configuration is hardcoded into source (highest-priority issue)

`https://localhost:7041` is duplicated as a string literal across `auth-service.ts`, `league-service.ts`, `draft-service.ts`, and `hubservice.ts`. There are no Angular environment files (`environment.ts` / `environment.prod.ts`).

Why this matters most: it's simultaneously an **architecture** smell (the data-access layer hardwires its own endpoint) and a **DevOps** smell (config is baked into the artifact at build time). Your Docker image compiles this literal into the JS bundle, so the *same image cannot be promoted* from dev → staging → prod — the cardinal rule of a build-once-deploy-many pipeline. Right now a production deploy would ship a bundle pointing at `localhost`.

**The senior move — and the DevOps teachable moment.** For a static SPA the build-time `environment.ts` approach is the common starting point, but it forces a rebuild per environment. The pattern that keeps "one image, many environments" intact is **runtime configuration**: serve a small `assets/config.json` (or have nginx substitute an env var into a `config.js` on container start via `envsubst` in the Docker entrypoint), and load it with an `APP_INITIALIZER` before the app boots. That way `docker run -e API_BASE_URL=...` reconfigures the *same* image. Either way, the literal must come out of every service and live behind a single `ApiConfig` token injected where needed.

### 2. No authentication wiring — the security seam is open

`AuthService.login()` receives a `token` in `UserResponse`, but every line that stores or attaches it is commented out. There is **no `HttpInterceptor`**, so no `Authorization` header is ever attached to outgoing requests, and there are **no route guards** (`canActivate`) — every route is reachable without a session.

This is the single biggest architectural gap for a real product. The correct shape:

- A functional **`authInterceptor`** that pulls the token from `GlobalStore` and sets the `Authorization` header on every API call — one place, applied uniformly, instead of per-service.
- A functional **`authGuard`** (`CanActivateFn`) protecting authenticated routes, redirecting to login otherwise.
- A single source of truth for "am I logged in." Today auth state is split between `AuthService.isLoggedIn$` (a `BehaviorSubject`) **and** `GlobalStore.user`. Two sources of truth for the same fact will drift. Collapse it into `GlobalStore` and derive `isLoggedIn` as a computed signal.

### 3. The `SharedModule` barrel works against the standalone architecture

`app.module.ts` defines a `SharedModule` that imports and re-exports `CommonModule`, `FormsModule`, the router, *fifteen* Angular Material modules, and the shared components, so every component can `import { SharedModule }` once. The file thoughtfully documents the trade-off — that awareness is good — but the choice itself undermines the main reason to be on standalone components: **precise tree-shaking**. Every component that imports `SharedModule` transitively pulls in all fifteen Material modules whether it uses `MatTable` or not.

It's also only half-applied: `APP_COMPONENTS` has every layout/feature component commented out, so the barrel covers Material but not your own components — an inconsistent state that's easy to trip over.

**Trade-off, stated plainly:** a `SharedModule` barrel buys ergonomics (one import line) at the cost of bundle precision and lazy-loading boundaries. For a medium app this is survivable, but it's the kind of convenience that quietly inflates the initial bundle. The more idiomatic path is small, purpose-scoped imports per component (verbose but tree-shakeable), or at most a *tiny* shared barrel of things genuinely used everywhere (`CommonModule`, your `Button`/`Custominput`) — not the entire Material catalogue.

### 4. State management has three homes with no clear boundary

State currently lives in (a) `GlobalStore` for user/team/league, (b) signals *inside* `DraftHub`/`ChatHub` for live draft and chat state, and (c) component-local signals. There's no documented rule for what belongs where.

Holding draft state inside the singleton `DraftHub` service is actually defensible — it's a root-provided singleton, so the state survives component churn. The concern is that **domain logic also lives in the transport layer**: `DraftHub` does timer math (`calculateTime`), maps raw `DraftState` payloads, and owns the reconnection policy, all in the same class that manages the WebSocket. A cleaner separation puts the SignalR connection in the hub service and the draft *domain* state/logic in a dedicated store or facade the hub feeds into. That keeps "how bytes arrive" separate from "what the draft means."

### 5. Duplicated and `any`-typed domain models

`League` exists twice — an `interface` in `league-service.ts` and a `class` in `models/league.ts` — with divergent fields. `Team` is defined in `team-service.ts`. There's no single canonical domain-model location, so the two `League` definitions will drift.

Separately, `strict` mode is on but routinely escaped with `any`: `login(credentials: any)`, `addleague(data: any)`, `leagues = signal<any[]>([])`. Strict typing at the API boundary is precisely where it pays off — typed request/response contracts are your first line of defense against backend/frontend drift. Define request DTOs (`LoginRequest`, `CreateLeagueRequest`) and consolidate models into a `models/` (or per-feature `*.model.ts`) home that both services and components import.

### 6. No centralized error handling

Services return raw observables; consumers handle failure with `console.error` or `alert()` (e.g. `my-teams-and-leagues.ts`). There's no `ErrorHandler`, no HTTP error interceptor, no user-facing error surface. For production you want an HTTP error interceptor (map 401 → logout/redirect, 5xx → toast) and a global `ErrorHandler`, so error UX is consistent rather than per-component.

### 7. Minor coupling bugs worth flagging

- `draft-list-players.ts` emits a **hardcoded `leagueId: 1`** in `draftPlayer()`. That's a latent correctness bug once more than one league drafts.
- Storing the full user object (and, once wired, the token) in `localStorage` exposes it to any XSS on the page. Prefer in-memory token + httpOnly refresh cookie if the backend can support it; at minimum, be deliberate about what goes into `localStorage`.

---

## Findings — does the macro-structure hold up under load?

Splitting "load" into the two things that actually scale differently here:

### Static delivery — scales well

The frontend compiles to static assets served by nginx. That tier is horizontally trivial to scale and CDN-friendly; serving more users is a caching/edge problem, not an app-architecture problem. No concern here.

### Initial bundle — pressure building

Three compounding factors inflate what every user downloads before they see anything:

- **No lazy loading.** `app.routes.ts` eagerly imports every feature (`Draft`, `Trade`, `Team`, chat, etc.). A user on the home page still downloads the entire draft room and SignalR client. Route-level `loadComponent` (lazy) would split each feature into its own chunk — the highest-leverage performance change available.
- **Two UI frameworks.** Angular Material *and* Bootstrap 5 (CSS + JS bundle + Popper + bootstrap-icons + Material) are both loaded globally. That's two design systems and two CSS payloads doing overlapping jobs. Pick one as primary; the production budget (`500kB` initial warning) will be eaten quickly by carrying both.
- **The `SharedModule` barrel** (finding #3) pulls all Material modules into anything that imports it.

None of these is fatal today, but together they set the initial-load trajectory in the wrong direction as features grow.

### Real-time layer — the genuine scaling question

This is where "high load" actually bites, and it's worth reasoning about explicitly:

- **Persistent connections.** Every draft participant holds an open WebSocket. That's expected for a draft room (small N per league), but total concurrent connections is now a *backend/infra* capacity dimension (SignalR backplane, sticky sessions / Redis if you scale out the .NET host behind a load balancer). Note this as an infra requirement before a multi-instance deploy.
- **Full-state broadcast.** `DraftHub` receives the *entire* `DraftState` (league, all draft players, all teams, all drafted-players-per-team) on every `UpdateDraftState`. For a single draft room this is fine; as player pools and team counts grow, re-sending the whole world on each pick wastes bandwidth. The scalable pattern is **delta updates** (send the pick, patch local state) with an occasional full snapshot for resync.
- **Unbounded chat.** `ChatHub.messages` is an ever-growing array with no pagination or virtualization. A long-running room grows memory and render cost without bound. Cap retained messages and/or virtualize the list.
- **Client timers are fine.** The per-client `setInterval(…, 1000)` for the countdown is cheap and correctly client-side — not a concern.

---

## Trade-off analysis (priority vs. effort)

| # | Finding | Impact | Effort | Do when |
|---|---------|--------|--------|---------|
| 1 | Hardcoded API URL / no env config | High (blocks real deploys) | Low | Now |
| 2 | No auth interceptor + guards; split auth state | High (security) | Medium | Now |
| 7 | `leagueId: 1` hardcode, routes file integrity | High (correctness) | Low | Now |
| 6 | No centralized error handling | Medium | Medium | Soon |
| 4 | State split across 3 homes; logic in transport | Medium | Medium | Soon |
| 5 | Duplicated models + `any` at API boundary | Medium | Low–Med | Soon |
| 3 | `SharedModule` barrel vs. tree-shaking | Medium (bundle) | Medium | With lazy loading |
| — | No lazy loading + two UI kits | Medium (load time) | Medium | Next perf pass |
| — | SignalR full-state broadcast / unbounded chat | Low now, High at scale | Medium | Before scale-out |

The top three are small, high-value, and unblock everything else — they're where to start.

---

## Consequences

**If adopted, what gets easier:** a single image deploys to any environment; auth is enforced uniformly in one place; the type system catches API drift; bundles shrink as features lazy-load; the draft room is ready for a multi-instance backend.

**What gets harder / the cost:** runtime config and interceptors add a little boot-time machinery; dropping the `SharedModule` barrel means more explicit imports per component; consolidating models requires a one-time refactor pass.

**What to revisit later:** delta-based SignalR updates and chat pagination once real concurrency arrives; choosing a single UI framework; whether draft domain state should move out of the hub service into a dedicated store.

---

## Action items

1. [ ] Extract all API/hub URLs into a single runtime config (`config.json` + `APP_INITIALIZER`, or nginx `envsubst` entrypoint); delete every `localhost:7041` literal.
2. [ ] Add a functional `authInterceptor` (attaches token) and `authGuard` (`CanActivateFn`); make `GlobalStore` the single source of auth truth and drop `isLoggedIn$`.
3. [ ] Fix the hardcoded `leagueId: 1` in `draft-list-players.ts`.
4. [ ] Add an HTTP error interceptor (401 → logout, 5xx → toast) and a global `ErrorHandler`.
5. [ ] Consolidate domain models into one location; remove the duplicate `League`; replace `any` at API boundaries with request/response DTOs.
6. [ ] Convert routes to lazy `loadComponent`; retire the `SharedModule` barrel in favor of scoped imports.
7. [ ] Pick one UI framework (Material *or* Bootstrap) as primary; plan removal of the other.
8. [ ] Before any multi-instance backend deploy: add SignalR delta updates + chat pagination, and document the sticky-session/Redis-backplane requirement.

---

*This is an evaluation ADR — it records the current state and recommended direction, not a committed implementation. Each action item above is a good candidate for its own focused ADR or PR.*
