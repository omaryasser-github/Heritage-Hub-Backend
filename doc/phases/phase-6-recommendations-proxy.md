# Phase 6: Recommendations Proxy (Pattern A Integration)

## Objective
Establish the HTTP bridge to the external Python FastAPI service, proxy user interaction signals, and cache recommendations inside PostgreSQL to enable high-speed client loads.

> **FastAPI service status:** The production Python FastAPI AI service is **in progress and will be delivered soon** by the AI engineering team. **Backend implementation starts now** using an internal `AiServiceClient` interface, environment-driven configuration, and a **local stub/mock client** for development and tests. When the real FastAPI service is available, swap the client implementation — no changes to mobile-facing routes or `GET /v1/home` response shape.

---

## Scope
*   **In Scope:**
    *   Configure NestJS `HttpModule` (`@nestjs/axios`) with timeouts (max **5000ms**), retries, and inter-service auth headers.
    *   Define an **`AiServiceClient` interface** with a **stub implementation** (deterministic mock responses) until the real FastAPI contract is wired.
    *   Dispatch user signal parameters to FastAPI (or stub): personality profile, favorites, recent interactions, quiz completion.
    *   **Async recommendation refresh:** BullMQ job → call FastAPI/stub → persist `RecommendationSnapshot` (home reads must **not** block on AI).
    *   Save recommendation payloads in `RecommendationSnapshot` (`recommendations` JSONB).
    *   Expose `GET /v1/home` — aggregated feed with a **"For You"** section from the latest snapshot (or PostgreSQL fallback).
    *   **Full chat module** per [api-endpoint-contract.md](../api-endpoint-contract.md): session CRUD in PostgreSQL; **proxy to FastAPI/stub only on message send**.
    *   Graceful degradation: logger warnings + unified fallback payloads when AI is unreachable (NFR-2).
    *   Wire recommendation refresh triggers from `POST /v1/favorites` and `POST /v1/personality/quiz/submit` (per [interaction-telemetry.md](../plans/interaction-telemetry.md) — do **not** duplicate in telemetry).
*   **Out Scope:**
    *   Recommendation algorithms inside NestJS (all engine logic lives in FastAPI).
    *   Chat streaming (SSE/WebSocket) — synchronous REST proxy for MVP.
    *   Real-time sub-second recommendation updates (async snapshot model is sufficient for MVP).

---

## Dependencies / Entry Criteria

| Criterion | Status | Notes |
|---|---|---|
| Phase 3 complete (explore content) | ✅ Required | Monuments/cities for home aggregation and fallbacks |
| Phase 4 complete (favorites, interactions) | ✅ Required | Signal inputs + BullMQ already available |
| Phase 5 complete (personality quiz) | ✅ Required | `PersonalityProfile` as primary persona signal |
| Prisma models: `RecommendationSnapshot`, `ChatSession`, `ChatMessage` | ✅ Ready | No new migrations expected for MVP |
| FastAPI OpenAPI / payload contract | ⏳ **Coming soon** | **Not a hard blocker** — use stub client + documented interim interface below |
| FastAPI mock/staging URL | ⏳ **Coming soon** | `AI_SERVICE_URL` points to stub in dev until real service ships |

---

## Architecture (MVP)

```text
Client                          NestJS                           FastAPI (soon)
──────                          ──────                           ──────────────
POST /favorites  ──┐
POST /quiz/submit ─┼──► Enqueue BullMQ (recommendations-refresh)
                   │         │
                   │         ▼
                   │    Worker: build signals → AiServiceClient → POST /recommendations
                   │         │                      (stub until real service)
                   │         ▼
                   │    INSERT recommendation_snapshot
                   │
GET /v1/home ──────────► Read latest snapshot (<50ms) ──► if missing/stale → PG fallback
```

**Rules:**
- `GET /v1/home` never calls FastAPI synchronously on the request path.
- Chat `POST .../messages` may call FastAPI synchronously (strict timeout); persist user + assistant messages in `chat_message`.
- Unknown network errors → log warning + return fallback text/recommendations, not raw Axios exceptions.

---

## Interim FastAPI Interface (stub until real service ships)

> Replace path/payload names when the AI team publishes the final OpenAPI spec. The NestJS `AiServiceClient` must hide these details from controllers.

### Recommendations (worker calls this)

```http
POST {AI_SERVICE_URL}/v1/recommendations
Authorization: Bearer {AI_SERVICE_API_KEY}
Content-Type: application/json
```

**Request (NestJS → FastAPI):**
```json
{
  "user_id": "uuid",
  "personality_type": "explorer | historian | strategist | culture_lover | null",
  "favorite_monument_ids": ["uuid"],
  "favorite_city_ids": ["uuid"],
  "recent_interactions": [
    { "action_type": "view_monument", "entity_type": "monument", "entity_id": "uuid" }
  ]
}
```

**Response (FastAPI → NestJS):**
```json
{
  "items": [
    {
      "type": "monument | city",
      "id": "uuid",
      "reason_en": "Because you explored Luxor temples...",
      "reason_ar": "..."
    }
  ]
}
```

### Chat (sync on message send)

```http
POST {AI_SERVICE_URL}/v1/chat/completions
Authorization: Bearer {AI_SERVICE_API_KEY}
```

**Request:**
```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "message": "string",
  "history": [{ "role": "user | assistant", "content": "string" }]
}
```

**Response:**
```json
{
  "reply": "string"
}
```

**Stub behaviour (until real FastAPI):** return deterministic mock `items` / `reply` based on `personality_type` and input IDs so mobile and E2E can integrate without the Python service.

---

## Environment Variables

Add to `.env.example` when implementing:

| Variable | Purpose | Dev default |
|---|---|---|
| `AI_SERVICE_URL` | FastAPI base URL | `http://localhost:8000` (stub accepts any reachable URL or use in-process stub) |
| `AI_SERVICE_API_KEY` | Inter-service auth | `dev-ai-key-change-me` |
| `AI_SERVICE_TIMEOUT_MS` | HTTP timeout | `5000` |
| `AI_SERVICE_USE_STUB` | Force stub client (no HTTP) | `true` until real FastAPI is deployed |

---

## Folder Structure
```text
src/modules/
├── recommendations/
│   ├── recommendations.module.ts
│   ├── recommendations.constants.ts      # Queue name, snapshot TTL hints
│   ├── recommendations.service.ts        # Snapshot read/write, fallback logic
│   ├── controllers/
│   │   └── home.controller.ts
│   ├── clients/
│   │   ├── ai-service.client.ts          # Interface + HTTP implementation
│   │   └── ai-service.stub.ts            # Mock until real FastAPI ships
│   ├── processors/
│   │   └── recommendation-refresh.processor.ts
│   └── dto/
│       └── home-response.dto.ts
└── ai-chat/
    ├── ai-chat.module.ts
    ├── ai-chat.controller.ts
    ├── ai-chat.service.ts
    └── dto/
        ├── create-session.dto.ts
        └── send-message.dto.ts
```

---

## Endpoints & Entities Touched

### Recommendations & home
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/home` | Bearer | Aggregated home feed + **For You** from `RecommendationSnapshot` |

### Chatbot (full MVP per API contract)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/chat/sessions` | Bearer | List sessions (cursor-paginated) |
| POST | `/v1/chat/sessions` | Bearer | Start session |
| GET | `/v1/chat/sessions/:sessionId/messages` | Bearer | List messages |
| POST | `/v1/chat/sessions/:sessionId/messages` | Bearer | Send message → proxy FastAPI/stub → persist reply |

### Entities
- `RecommendationSnapshot` — cached For You payload per refresh
- `ChatSession`, `ChatMessage` — conversation persistence
- **Read-only signals:** `PersonalityProfile`, `Favorite`, `UserInteraction`

---

## `GET /v1/home` Response Shape (MVP)

Align with mobile before locking types. Proposed envelope:

```json
{
  "data": {
    "for_you": {
      "source": "snapshot | fallback",
      "items": [
        {
          "type": "monument",
          "id": "uuid",
          "slug": "pyramids-of-giza",
          "name_en": "Pyramids of Giza",
          "name_ar": "...",
          "thumbnail_url": "...",
          "reason_en": "Because you favor ancient monuments",
          "reason_ar": "..."
        }
      ]
    },
    "featured_monuments": [],
    "generated_at": "ISO-8601 | null"
  }
}
```

- **Minimum 3 items** in `for_you` when possible (per user stories); pad from fallback if snapshot has fewer.
- `featured_monuments`: short curated list from explore (e.g. recent published monuments) — independent of AI.

---

## Fallback Strategy (when snapshot missing or FastAPI down)

Priority order for `for_you` items:

1. **Latest `RecommendationSnapshot`** for the user (if younger than configurable TTL, e.g. 7 days).
2. **Personality-based:** monuments matching `recommended_categories` from Phase 5 quiz (category slug filter).
3. **Top-rated:** monuments ordered by `AVG(rating.stars)` from the `rating` table (join; no `avg_rating` column on `monument`).
4. **Global popular:** recently published monuments (same as new-user default per user stories).

Never return HTTP 5xx solely because FastAPI is unavailable — set `source: "fallback"` and log a warning.

---

## Recommendation Refresh Triggers

| Event | Trigger location | Notes |
|---|---|---|
| `POST /v1/favorites` | `FavoritesService` after successful add | Enqueue refresh job |
| `POST /v1/personality/quiz/submit` | `PersonalityService` after profile upsert | Enqueue refresh job |
| Telemetry persisted | Optional post-MVP | Phase 6 MVP may defer worker hook on interaction ingest |

---

## Implementation Order

1. Env config + `AiServiceClient` interface + **stub implementation**
2. `RecommendationSnapshot` service + BullMQ `recommendations-refresh` processor
3. Hook refresh triggers (favorites, quiz submit)
4. `GET /v1/home` (snapshot read + fallback)
5. `ai-chat` module (session/message CRUD + proxy on send)
6. HTTP `AiServiceClient` implementation — flip when **real FastAPI is ready**
7. E2E tests with stub client (no external dependency)

---

## Acceptance Criteria
- [ ] `GET /v1/home` returns `for_you` + `featured_monuments` without calling FastAPI on the request path.
- [ ] Latest `RecommendationSnapshot` is used when present; response includes `source: "snapshot"`.
- [ ] If no snapshot or FastAPI refresh failed, `GET /v1/home` returns `source: "fallback"` with ≥3 items and does not crash.
- [ ] BullMQ refresh job persists a new snapshot after favorite add or quiz submit (with stub client).
- [ ] Chat: full session/message routes work; `POST .../messages` returns assistant reply (stub or real FastAPI).
- [ ] FastAPI/stub timeouts and errors produce logger warnings + unified fallback — no raw network exceptions to the client.
- [ ] `AI_SERVICE_USE_STUB=true` allows full local dev without the Python service.
- [ ] When real FastAPI ships: set `AI_SERVICE_USE_STUB=false`, configure `AI_SERVICE_URL` + `AI_SERVICE_API_KEY`, verify snapshot refresh against staging.

---

## Risks & Open Questions

| Risk | Mitigation |
|---|---|
| **FastAPI contract not final** | Stub client + interim interface above; swap implementation only |
| **Network latency on chat send** | 5000ms timeout; fallback message if exceeded |
| **Home blocking on AI** | Forbidden — snapshot read only on `GET /v1/home` |
| **Real FastAPI delivery timeline** | Backend unblocked via stub; integration test against staging when AI team deploys |
| **Mobile home JSON drift** | Confirm `for_you` / `featured_monuments` shape with frontend before release |

---

## References
- [api-endpoint-contract.md](../api-endpoint-contract.md) — `GET /v1/home`, chat routes
- [interaction-telemetry.md](../plans/interaction-telemetry.md) — refresh triggers, no duplicate telemetry for favorites/quiz
- [BACKEND_WORKFLOW.md](../../BACKEND_WORKFLOW.md) — Pattern A, async snapshots, NFR-2 latency budget
- [ADR-003](../adr/ADR-003-mvp-scope.md) — recommendations proxy in MVP scope
