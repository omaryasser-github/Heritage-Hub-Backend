# Guest Mode — Route Matrix

**Status:** Planned (deferred post-MVP core)  
**ADR:** [ADR-003](./adr/ADR-003-mvp-scope.md) · **Contract:** [api-endpoint-contract.md](./api-endpoint-contract.md)

All paths use the `/v1/` prefix (see contract).

---

## Interim (until guest mode ships)

| Access | Routes |
|---|---|
| **Public** | `GET /v1/app/config`, `/v1/auth/*` (see contract for logout token rules) |
| **Protected (Bearer)** | All other MVP routes |

---

## Target (when guest mode ships)

### Public — guest browse without account

| Method | Route |
|---|---|
| GET | `/v1/app/config` |
| POST | `/v1/auth/*` |
| GET | `/v1/cities`, `/v1/cities/:cityId` |
| GET | `/v1/monuments`, `/v1/monuments/:monumentId` |
| GET | `/v1/monuments/:monumentId/awareness`, `/timeline`, `/media`, `/panorama` |
| GET | `/v1/categories`, `/v1/search`, `/v1/search/suggestions` |
| GET | `/v1/home` _(TBD — anonymous vs personalized)_ |

### Protected — login wall (US-03b)

| Method | Route |
|---|---|
| GET/PATCH | `/v1/me`, `/v1/me/settings`, `/v1/me/personality` |
| GET/POST/DELETE | `/v1/me/favorites`, `/v1/favorites` |
| POST | `/v1/ratings`, `/v1/reports` |
| GET | `/v1/me/reports` |
| GET/POST | `/v1/personality/quiz`, `/v1/personality/quiz/submit` |
| GET/POST | `/v1/chat/sessions`, `/v1/chat/sessions/:sessionId/messages` |
| GET/POST | `/v1/notifications`, `/v1/notifications/read-all` |
| POST | `/v1/devices/push-token` |
| POST | `/v1/interactions/batch` _(or anonymous telemetry — TBD)_ |

---

## Implementation checklist

1. Add `@Public()` on guest-public routes
2. Update [api-endpoint-contract.md](./api-endpoint-contract.md) auth conventions
3. Frontend guest stack + login wall (US-03b)
4. Resolve open decisions below

## Open decisions

| Topic | Options |
|---|---|
| `GET /v1/home` for guests | Static feed vs auth-only |
| Guest chatbot | Block vs anonymous session |
| Guest telemetry | Off vs ephemeral session id |
