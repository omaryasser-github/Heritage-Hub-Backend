# Guest Mode — Route Matrix

**Status:** Planned (deferred post-MVP core)  
**ADR:** [ADR-003](./adr/ADR-003-mvp-scope.md)

Guest mode **will** be implemented: backend public routes first, then React Native UI (guest stack + login wall per US-03/US-03b).

Until guest mode ships, use the **Interim** column below (current contract).

---

## Interim (until guest mode ships)

| Access | Routes |
|---|---|
| **Public** | `GET /app/config`, all `/auth/*` |
| **Protected** | Everything else |

---

## Target (when guest mode ships)

### Public — guest can access without account

| Method | Route | Notes |
|---|---|---|
| `GET` | `/app/config` | Bootstrap |
| `POST` | `/auth/*` | Login/register when guest chooses |
| `GET` | `/cities` | Browse cities |
| `GET` | `/cities/:cityId` | City detail |
| `GET` | `/monuments` | List monuments (filter `kind`, `category`, `city_id`) |
| `GET` | `/monuments/:monumentId` | Monument detail |
| `GET` | `/monuments/:monumentId/awareness` | Educational content |
| `GET` | `/monuments/:monumentId/timeline` | Timeline |
| `GET` | `/monuments/:monumentId/media` | Media gallery |
| `GET` | `/monuments/:monumentId/panorama` | 360° viewer metadata |
| `GET` | `/categories` | Category list |
| `GET` | `/search` | Search |
| `GET` | `/search/suggestions` | Typeahead |
| `GET` | `/home` | **TBD** — anonymous feed vs auth-only personalized feed |

### Protected — login wall (US-03b)

| Method | Route | Guest behavior |
|---|---|---|
| `GET` | `/me`, `PATCH /me` | Login wall |
| `GET/PATCH` | `/me/settings` | Login wall |
| `GET` | `/me/personality` | Login wall |
| `GET/POST/DELETE` | `/me/favorites`, `/favorites` | Login wall |
| `POST` | `/ratings`, `/reports` | Login wall |
| `GET` | `/me/reports` | Login wall |
| `GET/POST` | `/personality/quiz`, submit | Login wall |
| `GET/POST` | `/chat/sessions`, messages | Login wall — **hardest** (needs anonymous session design) |
| `GET/POST` | `/notifications` | Login wall |
| `POST` | `/devices/push-token` | Login wall |
| `POST` | `/interactions/batch` | Login wall (or anonymous telemetry — TBD) |

---

## Implementation checklist (when ready)

1. Add `@Public()` decorator to routes in **Public** table
2. Update `api-endpoint-contract.md` auth rule
3. Frontend: Auth stack with Guest Access + contextual login modal (US-03b)
4. Language preference: server for registered; **local only** for guests (US-00)
5. Decide chatbot guest policy (public read-only FAQ vs login wall)
6. Update Phase 3 endpoint annotations from `(Public)` to match this matrix

---

## Open decisions

| Topic | Options |
|---|---|
| `GET /home` for guests | Static curated feed vs require auth |
| Guest chatbot | Block entirely vs anonymous session |
| Guest interaction telemetry | Off vs anonymous session ID |
| Chat history on login | Merge anonymous session into user account |
