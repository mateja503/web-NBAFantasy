# Deployment & scaling notes

Operational notes for running WebNBAFantasy beyond a single local instance.
Pairs with `ADR-001-frontend-architecture-evaluation.md` (action item #8).

## Runtime configuration

The frontend is a static bundle; the API base URL is supplied at container
start, not baked in at build time (see ADR-001 #1).

```bash
docker build -t web-nba-fantasy .
docker run -p 8080:80 -e API_BASE_URL=https://api.staging.example.com web-nba-fantasy
```

The `docker/entrypoint.sh` hook runs `envsubst` over `config.template.json` to
produce `/usr/share/nginx/html/config.json`, which the app fetches on boot via
`APP_INITIALIZER`. The same image is therefore promotable across environments —
no rebuild per environment.

## SignalR: required before scaling the backend horizontally

The draft and chat features hold persistent WebSocket connections. Running more
than one backend instance behind a load balancer requires two things:

1. **Sticky sessions (session affinity).** A client's negotiate request and its
   subsequent WebSocket must reach the same server instance. Enable affinity on
   the load balancer / ingress.

2. **A backplane (Redis).** With multiple instances, a message published on one
   instance must reach clients connected to another. Configure the ASP.NET Core
   SignalR Redis backplane (`AddStackExchangeRedis`) so hub messages fan out
   across instances.

Without both, a multi-instance deployment will drop messages and fail
reconnects intermittently — symptoms that are hard to diagnose after the fact.

## Real-time payload efficiency (backend follow-up)

`DraftHub` currently receives the **entire** `DraftState` (league, all draft
players, all teams, all drafted-players-per-team) on every `UpdateDraftState`.
That is fine for a single draft room but wastes bandwidth as pools/teams grow.

Planned improvement (requires backend changes):

- Send **delta updates** (the single pick that changed) instead of the full
  state on each event.
- Send a full snapshot only on connect / resync.

The client already caps retained chat messages (`MAX_MESSAGES` in `chatHub.ts`);
the server should expose paged history rather than replaying an entire room.

## CI/CD

`Jenkinsfile` builds the image and pushes to Docker Hub. Before production use,
replace the placeholder `Test Image` stage (`echo "Tests passed"`) with a real
`ng test` / lint run executed inside the build stage, and gate the push on it.
