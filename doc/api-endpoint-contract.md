# Heritage Hub — Consolidated API Contract

> Single source of truth for every endpoint across the Heritage Hub application, reconciled with the locked ADRs. All paths are relative to `{{baseUrl}}`. 
  

**Conventions**

- **Versioning:** all routes are versioned under `/v1/` (resolved — applies project-wide, matching `BACKEND_WORKFLOW.md`).
    
- **Auth:** `Bearer {{accessToken}}` unless marked _Public_. `user_id` is always derived server-side from the JWT — never accepted from the client.
    
- **Pagination:** cursor-based via `?cursor=&limit=`. Standard list response shape: `{ "data": [...], "cursor": "", "has_next": true|false }`.
    
- **Error envelope:** all errors use a unified shape: `{ "error": { "code": "string", "message": "string", "details": [] } }`.
    
- **Entity references (ADR-007):** Only `USER_INTERACTION` uses the string-based polymorphic pair `entity_type` + `entity_id`. Ratings, reports, and favorites reference the target via explicit `cityId` / `monumentId` in the request body — **not** a polymorphic pair.
    
- **Localization:** bilingual (English/Arabic) content where applicable.
    

---

## 1\. App Bootstrap

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/app/config` | Public | App configuration, feature flags, minimum supported version (cacheable). |

## 2\. Authentication

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/v1/auth/register` | Public | Register a new user with email + password. |
| POST | `/v1/auth/login` | Public | Email/password login; returns access + rotating refresh tokens. |
| POST | `/v1/auth/social` | Public | Social login (Google / Facebook / Apple, OAuth 2.0). |
| POST | `/v1/auth/refresh` | Public (refresh token in body) | Exchange a rotating refresh token for a new access token. |
| POST | `/v1/auth/logout` | Refresh token in body | Revoke the current session's refresh token. |
| POST | `/v1/auth/logout-all` | Bearer (access token) | Revoke all sessions for the user. |
| POST | `/v1/auth/password/reset-request` | Public | Request a password reset email. |
| POST | `/v1/auth/password/reset-confirm` | Public | Confirm password reset with token + new password. |

## 3\. User Profile & Settings

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/me` | Bearer | Get the current user's profile. |
| PATCH | `/v1/me` | Bearer | Update profile (display name, avatar, language, etc.). |
| GET | `/v1/me/settings` | Bearer | Get user settings. |
| PATCH | `/v1/me/settings` | Bearer | Update user settings. |

## 4\. Devices & Push

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/v1/devices/push-token` | Bearer | Idempotent upsert of the device push token. |

## 5\. Home & Discovery

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/home` | Bearer | Aggregated home feed, including the "For You" recommendations section. |
| GET | `/v1/categories` | Bearer | List content categories. |
| GET | `/v1/search?q=&cursor=&limit=` | Bearer | Full-text search across cities/monuments/categories (bilingual). |
| GET | `/v1/search/suggestions?q=` | Bearer | Type-ahead search suggestions. |

## 6\. Cities

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/cities?cursor=&limit=` | Bearer | List cities (cursor-paginated). |
| GET | `/v1/cities/:cityId` | Bearer | Get a single city (bilingual detail). |

## 7\. Monuments (ADR-004)

> Per ADR-004, the resource is `/monuments` with `:monumentId`. Templates are exposed via `?kind=template` on the same Monument table (no separate `/items` resource). 
  

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/monuments?city_id=&category=&kind=&cursor=&limit=` | Bearer | List monuments; filter by `city_id`, `category`, and `kind` (`monument` default, `template`). |
| GET | `/v1/monuments/:monumentId` | Bearer | Get a single monument. |
| GET | `/v1/monuments/:monumentId/awareness` | Bearer | Cultural / safety / awareness cards for a monument. |
| GET | `/v1/monuments/:monumentId/timeline` | Bearer | Historical timeline events for a monument. |
| GET | `/v1/monuments/:monumentId/media` | Bearer | Media assets (photos, infographics, maps) for a monument. |

## 8\. Panorama

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/monuments/:monumentId/panorama` | Bearer | 360° panorama (multi-resolution URLs, narration, camera bounds). |

## 9\. Personality Quiz

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/personality/quiz` | Bearer | Get the personality quiz. |
| POST | `/v1/personality/quiz/submit` | Bearer | Submit personality quiz answers. |
| GET | `/v1/me/personality` | Bearer | Get the current user's personality profile. |

## 10\. Favorites

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/me/favorites?cursor=&limit=` | Bearer | List the user's favorites. |
| POST | `/v1/favorites` | Bearer | Add a favorite (target via `monumentId` / `cityId` in body — ADR-007). |
| DELETE | `/v1/favorites/:monumentId` | Bearer | Remove a favorite. |

## 11\. Ratings & Reports

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/v1/ratings` | Bearer | Create / update a rating (1–5 stars); target via `monumentId` / `cityId` in body. |
| POST | `/v1/reports` | Bearer | Report inaccurate or inappropriate content; target via `monumentId` / `cityId` in body. |
| GET | `/v1/me/reports?cursor=&limit=` | Bearer | List the user's submitted reports. |

## 12\. Chatbot

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/chat/sessions?cursor=&limit=` | Bearer | List chat sessions. |
| POST | `/v1/chat/sessions` | Bearer | Start a new chat session. |
| GET | `/v1/chat/sessions/:sessionId/messages?cursor=&limit=` | Bearer | Get messages in a session. |
| POST | `/v1/chat/sessions/:sessionId/messages` | Bearer | Send a message in a session. |

## 13\. Notifications

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/v1/notifications?cursor=&limit=` | Bearer | List notifications. |
| POST | `/v1/notifications/:notificationId/read` | Bearer | Mark a single notification as read. |
| POST | `/v1/notifications/read-all` | Bearer | Mark all notifications as read. |

## 14\. User Interaction Telemetry

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/v1/interactions/batch` | Bearer | Submit a batch of passive interaction events (async via BullMQ). Returns `202 Accepted` with `{ data: { accepted, rejected } }`. Max 50 events/batch; 30 req/min per user. See §14.1. |

### 14.1 Telemetry payload

Request body:

``` json
{
  "events": [
    {
      "event_id": "uuid",
      "action_type": "view_monument | view_city | view_panorama | search | view_home",
      "entity_type": "city | monument | panorama",
      "entity_id": "uuid",
      "occurred_at": "ISO-8601",
      "duration_seconds": 45
    }
  ]
}

 ```

- `duration_seconds` is required for `view_monument` / `view_city` / `view_panorama`; omit for `search` / `view_home`.
    
- **Errors:** `400` (schema/enum invalid), `401` (no/invalid token), `413` (batch > 50).
    
- **Trigger note:** `add_favorite` and `complete_quiz` are handled by their own endpoints (favorites, personality quiz) and are intentionally NOT duplicated as telemetry events.
    
- **Reference:** see `doc/plans/interaction-telemetry.md` and the "User Interaction Telemetry — Plan" folder in this collection.
    

---

## Endpoint Inventory Summary (MVP)

| Domain | Endpoints |
| --- | --- |
| App Bootstrap | 1 |
| Authentication | 8 |
| User Profile & Settings | 4 |
| Devices & Push | 1 |
| Home & Discovery | 4 |
| Cities | 2 |
| Monuments | 5 |
| Panorama | 1 |
| Personality Quiz | 3 |
| Favorites | 3 |
| Ratings & Reports | 3 |
| Chatbot | 4 |
| Notifications | 3 |
| User Interaction Telemetry | 1 |
| **Total (MVP)** | **43** |

---

## Deferred — Not in MVP

These exist as requirements but are explicitly out of MVP per ADR-003. They are NOT counted in the inventory above.

| Domain | Proposed endpoints | Authority |
| --- | --- | --- |
| Gamified Quizzes | `GET /v1/monuments/:monumentId/quizzes`, `GET /v1/quizzes/:quizId`, `POST /v1/quizzes/:quizId/attempts` | ADR-003 (deferred) |
| Leaderboards (US-34) | `GET /v1/leaderboards?period=weekly|monthly|all_time` | Backlog |
| Achievements (US-31/32) | `GET /v1/achievements`, `GET /v1/me/achievements` | Backlog |
| Challenges (US-25) | `GET /v1/me/challenges` | Backlog |
| Learning Paths (US-23) | `GET /v1/me/learning-path` | Backlog |
| Admin Panel (US-38–40) | content management, moderation queue, analytics (separate admin service/collection) | Backlog |

> Note: the gamified quiz endpoints currently still exist in the Heritage-Hub-API Postman collection (Quizzes folder). They are retained there for design reference but are **Deferred — not MVP** per ADR-003. 
  

---

## Open Questions / Follow-ups

- **Guest mode:** deferred per ADR-003. Interim rule: all endpoints require auth in MVP; guest access matrix to be defined when guest mode ships.
    
- **Items vs Monuments:** RESOLVED per ADR-004 — `/monuments` is canonical; `/items` is retired. Any lingering `/items` references should be migrated.
    
- **Reference docs:** ADR index, `BACKEND_WORKFLOW.md`, `interaction-telemetry.md`, and the feature/phase plan should be linked from here once paths are finalized.
    

> Maintenance: when an endpoint is added/changed in the Heritage-Hub-API collection, update this contract in the same change so the two never drift.