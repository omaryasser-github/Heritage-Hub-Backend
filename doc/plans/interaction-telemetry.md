# User Interaction Telemetry — Plan

**Status:** Approved direction (pre-implementation)  
**Related:** [ADR-007](./adr/ADR-007-polymorphic-associations.md), [BACKEND_WORKFLOW.md](../BACKEND_WORKFLOW.md), Phase 6 recommendations

## Problem

Panorama gestures (zoom, pan, dwell time) fire **many events per minute**. Writing each event synchronously to PostgreSQL can saturate DB connections. The AI recommendation engine (Pattern A) needs these signals to personalize content.

Docs described Redis buffering but lacked an API contract. This plan defines the intake pipeline.

---

## Architecture

```
Mobile client
    │  batch every 5s or 20 events (whichever first)
    ▼
POST /v1/interactions/batch  (Protected — JWT required)
    │
    ▼
NestJS InteractionsController → validate DTO → push to Redis list/queue
    │
    ▼
BullMQ worker (micro-batch every 2–5s or 100 events)
    │
    ▼
bulk INSERT into user_interaction (PostgreSQL)
    │
    ▼
(Optional) trigger recommendation refresh job → FastAPI → RecommendationSnapshot
```

---

## Endpoint

### `POST /v1/interactions/batch`

**Auth:** Protected (registered user). Guest mode (future): requires anonymous session design — defer until [guest-mode-route-matrix.md](./guest-mode-route-matrix.md) ships.

**Request body:**

```json
{
  "events": [
    {
      "entity_type": "monument",
      "entity_id": "550e8400-e29b-41d4-a716-446655440000",
      "action_type": "panorama_open",
      "duration_seconds": 45,
      "client_timestamp": "2026-06-24T12:00:00.000Z",
      "metadata": {}
    }
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `events` | array | yes | 1–50 events per batch (hard cap) |
| `entity_type` | enum | yes | `city` \| `monument` \| `panorama` \| `hotspot` |
| `entity_id` | uuid | yes | Soft reference (matches ADR-007) |
| `action_type` | enum | yes | `view` \| `panorama_open` \| `hotspot_open` \| `media_view` \| `quiz_start` \| `share` |
| `duration_seconds` | int | no | For dwell-time actions |
| `client_timestamp` | ISO 8601 | yes | Client clock; server adds `created_at` on persist |
| `metadata` | object | no | No PII — e.g. `{ "zoom_level": 3 }` |

**Response (202 Accepted):**

```json
{
  "data": {
    "accepted": 12,
    "rejected": 0
  }
}
```

Invalid events in a batch are rejected individually; valid ones are still accepted.

**Rate limit:** 30 requests/minute per user (throttler). Bursts absorbed by client-side batching.

---

## Storage model

Uses `UserInteraction` from ADR-007 (string-based `entityType` + `entityId`).

Server sets `userId` from JWT — client never sends `user_id`.

---

## Client batching rules

| Rule | Value |
|---|---|
| Flush interval | Every **5 seconds** while screen is active |
| Max batch size | **20 events** |
| Flush on background | App backgrounded → flush immediately |
| Drop policy | If offline, queue locally (max 200 events), drop oldest on overflow |

---

## Module placement

```
src/modules/
└── interactions/
    ├── interactions.module.ts
    ├── interactions.controller.ts
    ├── interactions.service.ts      # Redis enqueue
    ├── processors/
    │   └── interaction-batch.processor.ts   # BullMQ → Prisma bulk create
    └── dto/
        └── interaction-batch.dto.ts
```

**Phase assignment:** Build alongside Phase 4 (feedback) or early Phase 6 (before recommendations need signals).

---

## Privacy & security

- No PII in `metadata`
- Auth required (MVP)
- Throttled per user
- Events are append-only; no client delete

---

## Acceptance criteria

- [ ] `POST /v1/interactions/batch` returns 202 with accepted count
- [ ] Events appear in `user_interaction` within 10s under normal load
- [ ] Invalid `entity_type` returns 400 with unified error envelope
- [ ] Unauthenticated request returns 401
- [ ] Redis failure falls back to direct DB write with warning log (degraded mode)

---

## Future (guest mode)

When guest mode ships, define either:
- **Option A:** No telemetry for guests (simplest)
- **Option B:** Anonymous `guest_session_id` header + ephemeral Redis session (no `userId` FK until login merge)

Decision deferred to guest mode implementation.
