# Heritage Hub — Frontend ↔ Backend Integration Handoff

> **Audience:** Mobile frontend team (React Native + Expo)  
> **Backend repo:** Heritage-Hub-Backend  
> **Status:** Phases 0–7 implemented — ready for API integration  
> **Last updated:** June 2026

This document is the **single handoff** for connecting the Expo app to the live NestJS API. Share it with the frontend team to start implementation without guessing URLs, payloads, or auth flow.

**Related docs (backend repo):**

- [api-endpoint-contract.md](./api-endpoint-contract.md) — full route inventory
- [FRONTEND_WORKFLOW.md](../FRONTEND_WORKFLOW.md) — frontend architecture (folder structure)
- Swagger (local): `http://localhost:3000/v1/docs`

---

## 1. What the backend provides today

| Area | Status | Notes |
|------|--------|-------|
| App bootstrap | ✅ Live | `GET /v1/app/config` |
| Auth (email/password) | ✅ Live | Register, login, refresh, logout |
| User profile | ✅ Live | `GET/PATCH /v1/me` |
| Home feed | ✅ Live | `GET /v1/home` (For You + featured) |
| Cities, monuments, categories, search | ✅ Live | Cursor-paginated lists + detail sub-resources |
| Personality quiz | ✅ Live | 7 questions, 4 persona types |
| Favorites, ratings, reports | ✅ Live | ADR-007: `cityId` **or** `monumentId` in body |
| Notifications inbox | ✅ Live | List + mark read |
| Interaction telemetry | ✅ Live | `POST /v1/interactions/batch` → `202` |
| AI chat | ✅ Live | Proxies to TourBot FastAPI — **do not call AI URL from mobile** |
| OAuth social login | ❌ Not implemented | Returns `501 NOT_IMPLEMENTED` |
| Password reset | ❌ Not implemented | — |
| `/me/settings` | ❌ Not implemented | — |
| Push token (`/devices/push-token`) | ❌ Not implemented | — |
| Panorama API | ❌ Intentionally skipped | Keep **bundled assets** on frontend (Phase 4.1b) |

---

## 2. Connection setup (do this first)

### 2.1 Base URL

All routes are under **`/v1`**.

| Environment | Frontend env variable | Example value |
|-------------|----------------------|---------------|
| Local dev (Expo web on PC) | `EXPO_PUBLIC_API_URL` | `http://localhost:3000/v1` |
| Android emulator | `EXPO_PUBLIC_API_URL` | `http://10.0.2.2:3000/v1` |
| iOS simulator | `EXPO_PUBLIC_API_URL` | `http://localhost:3000/v1` |
| Physical device (same Wi‑Fi) | `EXPO_PUBLIC_API_URL` | `http://<BACKEND_PC_IP>:3000/v1` |

Create **`.env`** in the frontend project:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/v1
```

Restart Expo after changing env: `npx expo start -c`.

### 2.2 CORS (backend team configures)

Backend `.env` must list every origin the app runs on:

```env
CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:5173
```

Add the PC IP origin if testing Expo web on a phone. Restart backend after changes.

### 2.3 Backend must be running

```bash
# In Heritage-Hub-Backend
npm run start:dev
```

Smoke test in browser: `http://localhost:3000/v1/health` → `{ "data": { "status": "ok", ... } }`

### 2.4 Rules for the mobile app

1. **Never** call the TourBot / FastAPI URL directly — only `POST /v1/chat/sessions/.../messages`.
2. **Never** send `user_id` in request bodies — identity comes from JWT.
3. Store **`accessToken`** and **`refreshToken`** securely (Expo SecureStore).
4. Attach **`Authorization: Bearer <accessToken>`** on all protected routes.

---

## 3. Global API conventions

### 3.1 Success envelope

Every successful response is wrapped:

```json
{
  "data": { }
}
```

Paginated lists:

```json
{
  "data": [ ],
  "cursor": "base64-opaque-string-or-null",
  "has_next": true
}
```

Read from **`response.data`**, not the raw HTTP body root.

### 3.2 Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["email must be an email"]
    }
  }
}
```

Common codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `EMAIL_ALREADY_EXISTS` (409), `TOO_MANY_REQUESTS` (429).

### 3.3 Auth

| Type | Routes |
|------|--------|
| **Public** (no token) | `/v1/health`, `/v1/app/config`, `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout` |
| **Bearer required** | Everything else (content, home, chat, favorites, …) |

Access token TTL: **~15 minutes** (`JWT_ACCESS_EXPIRES`). Refresh before expiry:

```http
POST /v1/auth/refresh
Content-Type: application/json

{ "refreshToken": "<refreshToken>" }
```

Response: new `{ "data": { "accessToken", "refreshToken" } }`.

### 3.4 JSON naming (important — mixed styles)

| Direction | Style | Example |
|-----------|--------|---------|
| **Content API responses** | `snake_case` | `name_en`, `city_id`, `thumbnail_url`, `has_next` |
| **Auth token response** | `camelCase` | `accessToken`, `refreshToken` |
| **User profile (`/me`)** | `camelCase` | `displayName`, `avatarUrl`, `createdAt` |
| **Feedback request bodies** | `camelCase` | `cityId`, `monumentId` |
| **Quiz submit request** | `snake_case` | `question_id`, `value` |

Do **not** send extra fields — backend rejects unknown properties (`400 VALIDATION_ERROR`).

### 3.5 Pagination

Query params: `?cursor=<opaque>&limit=<number>` (default limit ~20, max enforced server-side).

Stop when `has_next === false`.

### 3.6 Rate limits

- General routes: **60 requests / minute** per IP
- Auth (`login`, `register`): **10 requests / minute** per IP

---

## 4. Where to implement in frontend `src/`

Align with [FRONTEND_WORKFLOW.md](../FRONTEND_WORKFLOW.md):

```text
src/core/api/
  client.ts           # fetch wrapper, base URL, auth header, envelope unwrap
  auth.api.ts         # register, login, refresh, logout
  types.ts            # ApiError, DataEnvelope, paginated types

src/features/auth/          # wire Login / SignUp to auth.api.ts
src/features/explore/api/   # replace landmarksRepository calls gradually
src/features/chatbot/       # wire AI Guide to chat sessions API
```

**Recommended stack:** TanStack Query for server state + existing Zustand `authStore` for tokens.

---

## 5. Implementation plan (recommended order)

### Phase A — Foundation (Day 1)

| # | Task | Endpoint |
|---|------|----------|
| A1 | Add `EXPO_PUBLIC_API_URL` + `client.ts` | — |
| A2 | Bootstrap on splash | `GET /app/config` |
| A3 | Register / login | `POST /auth/register`, `POST /auth/login` |
| A4 | Persist tokens in SecureStore | — |
| A5 | Auto-attach Bearer + refresh on 401 | `POST /auth/refresh` |
| A6 | Load profile after login | `GET /me` |

**Exit criteria:** User can sign up, sign in, and `GET /me` returns profile.

---

### Phase B — Home & content (Days 2–3)

| # | Task | Endpoint |
|---|------|----------|
| B1 | Replace home feed mock | `GET /home` |
| B2 | Monument grid / search | `GET /monuments`, `GET /search?q=` |
| B3 | Monument detail | `GET /monuments/:id` |
| B4 | Awareness / timeline / media tabs | `GET /monuments/:id/awareness`, `/timeline`, `/media` |
| B5 | Categories filter pills | `GET /categories` |
| B6 | Cities (Explore map metadata) | `GET /cities`, `GET /cities/:id` |

**Exit criteria:** Home and monument detail load from API; panorama still uses **local bundled assets** (no panorama API).

---

### Phase C — Onboarding & personalization (Day 4)

| # | Task | Endpoint |
|---|------|----------|
| C1 | Fetch quiz | `GET /personality/quiz` |
| C2 | Submit answers (exactly 7) | `POST /personality/quiz/submit` |
| C3 | Show persona on profile | `GET /me/personality` |

**Quiz submit body:**

```json
{
  "answers": [
    { "question_id": "q1", "value": 5 },
    { "question_id": "q2", "value": 1 },
    { "question_id": "q3", "value": 1 },
    { "question_id": "q4", "value": 1 },
    { "question_id": "q5", "value": 5 },
    { "question_id": "q6", "value": 1 },
    { "question_id": "q7", "value": 1 }
  ]
}
```

**Persona types:** `explorer` | `historian` | `strategist` | `culture_lover`

---

### Phase D — User actions (Day 5)

| # | Task | Endpoint |
|---|------|----------|
| D1 | Favorites list / add / remove | `GET /me/favorites`, `POST /favorites`, `DELETE /favorites/:id` |
| D2 | Star ratings | `POST /ratings` |
| D3 | Content reports | `POST /reports` |
| D4 | Notifications | `GET /notifications`, mark read endpoints |

**Favorite / rating body (one of):**

```json
{ "monumentId": "uuid" }
```

```json
{ "cityId": "uuid" }
```

```json
{ "monumentId": "uuid", "stars": 5 }
```

---

### Phase E — AI Guide (Day 6)

| # | Task | Endpoint |
|---|------|----------|
| E1 | Create session | `POST /chat/sessions` |
| E2 | Send user message | `POST /chat/sessions/:sessionId/messages` |
| E3 | Load history | `GET /chat/sessions/:sessionId/messages` |
| E4 | List past sessions | `GET /chat/sessions` |

**Send message body:**

```json
{ "message": "Tell me about Karnak Temple" }
```

**Assistant response (`data`):**

```json
{
  "id": "uuid",
  "role": "assistant",
  "content": "...",
  "created_at": "ISO-8601"
}
```

If AI is down, `content` is a friendly fallback string (HTTP 200).

---

### Phase F — Telemetry (optional, post-MVP polish)

| # | Task | Endpoint |
|---|------|----------|
| F1 | Batch screen views | `POST /interactions/batch` |

Returns **`202 Accepted`**. Max **50 events** per batch. Do **not** duplicate favorite/quiz events here.

---

## 6. Endpoint reference (implemented routes)

Base: `{EXPO_PUBLIC_API_URL}` → e.g. `http://localhost:3000/v1`

### 6.1 Bootstrap

```http
GET /app/config
```

```json
{
  "data": {
    "min_supported_version": "1.0.0",
    "feature_flags": {
      "guest_mode": false,
      "chat_enabled": true,
      "recommendations_enabled": true
    }
  }
}
```

---

### 6.2 Authentication

```http
POST /auth/register
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Password: minimum **8 characters**.

```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "uuid.hexsecret"
  }
}
```

```http
POST /auth/logout
{ "refreshToken": "..." }

POST /auth/logout-all
Authorization: Bearer <accessToken>
```

---

### 6.3 Profile

```http
GET /me
PATCH /me
Authorization: Bearer <accessToken>
```

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": null,
    "avatarUrl": null,
    "language": "en",
    "role": "user",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

```http
PATCH /me
{ "displayName": "Omar", "language": "ar" }
```

Allowed: `displayName`, `avatarUrl`, `language` (`en` | `ar`).

---

### 6.4 Home

```http
GET /home
Authorization: Bearer <accessToken>
```

```json
{
  "data": {
    "for_you": {
      "source": "snapshot",
      "items": [
        {
          "type": "monument",
          "id": "uuid",
          "slug": "karnak-temple",
          "name_en": "Karnak Temple",
          "name_ar": "...",
          "thumbnail_url": "https://...",
          "reason_en": "Suggested for your explorer travel style",
          "reason_ar": "..."
        }
      ]
    },
    "featured_monuments": [
      {
        "id": "uuid",
        "slug": "...",
        "name_en": "...",
        "name_ar": "...",
        "thumbnail_url": "...",
        "city_id": "uuid"
      }
    ],
    "generated_at": "ISO-8601-or-null"
  }
}
```

`for_you.source`: `"snapshot"` (from AI cache) or `"fallback"` (personality / top-rated / recent).

---

### 6.5 Monuments & cities

```http
GET /monuments?city_id=&category=&kind=monument&cursor=&limit=
GET /monuments/:monumentId
GET /monuments/:monumentId/awareness
GET /monuments/:monumentId/timeline
GET /monuments/:monumentId/media
GET /cities?cursor=&limit=
GET /cities/:cityId
GET /categories
GET /search?q=pyramids&cursor=&limit=
GET /search/suggestions?q=pyr
```

**Monument list item (`data[]`):**

```json
{
  "id": "uuid",
  "slug": "abu-simbel",
  "name_en": "Abu Simbel",
  "name_ar": "...",
  "city_id": "uuid",
  "thumbnail_url": "https://...",
  "latitude": 22.3372,
  "longitude": 31.6258,
  "kind": "monument",
  "category_slugs": ["ancient-temples"]
}
```

Use **`slug`** for navigation (matches current `MonumentDetail { slug }` param).

---

### 6.6 Personality

```http
GET /personality/quiz
POST /personality/quiz/submit
GET /me/personality
```

---

### 6.7 Favorites

```http
GET /me/favorites?cursor=&limit=
POST /favorites
DELETE /favorites/:targetId?type=monument|city
```

---

### 6.8 Chat

```http
POST /chat/sessions
GET /chat/sessions?cursor=&limit=
GET /chat/sessions/:sessionId/messages?cursor=&limit=
POST /chat/sessions/:sessionId/messages
```

---

### 6.9 Interactions (telemetry)

```http
POST /interactions/batch
→ 202 Accepted

{
  "events": [
    {
      "event_id": "uuid",
      "action_type": "view_monument",
      "entity_type": "monument",
      "entity_id": "uuid",
      "occurred_at": "2026-06-27T10:00:00.000Z",
      "duration_seconds": 45
    }
  ]
}
```

`action_type`: `view_monument` | `view_city` | `view_panorama` | `search` | `view_home`

---

## 7. Migrating from local seed JSON

Today the app uses `src/core/data/egypt-tourism-landmarks.json` via `landmarksRepository`.

| Screen / feature | Replace with |
|------------------|--------------|
| Home feed cards | `GET /home` + `GET /monuments` |
| Search | `GET /search` |
| Monument detail text/media | `GET /monuments/:id` + sub-resources |
| Panorama textures & hotspots | **Keep bundled** — no backend route |
| Explore map pins | `GET /cities` + monument `latitude`/`longitude` |
| Chatbot replies | `POST /chat/sessions/:id/messages` |

**Mapping tip:** Backend uses the same **slug** values as seed data (from shared seed JSON). Existing `navigation.navigate('MonumentDetail', { slug })` can stay; only the data fetch changes.

---

## 8. Suggested `client.ts` contract (pseudo-code)

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await secureStore.getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw body.error; // { code, message, details }
  }

  return body.data as T;
}
```

Wire TanStack Query hooks on top: `useQuery(['home'], () => api('/home'))`, etc.

---

## 9. QA checklist (frontend)

- [ ] `GET /app/config` works without token
- [ ] Register + login return tokens; stored in SecureStore
- [ ] `GET /me` works with Bearer
- [ ] Token refresh works after 15+ minutes (or forced 401)
- [ ] `GET /home` renders For You + featured sections
- [ ] Monument detail by `slug` → resolve id via list/search or add slug-based route later
- [ ] Favorites add/remove round-trip
- [ ] Chat: create session → send message → receive `assistant` reply
- [ ] RTL: verify `name_ar` fields display correctly
- [ ] Offline / API error: show error UI from `error.code` + `error.message`
- [ ] Physical device: `EXPO_PUBLIC_API_URL` uses PC LAN IP, not `localhost`

---

## 10. Backend team contacts & tools

| Resource | URL / path |
|----------|------------|
| Swagger UI | `http://localhost:3000/v1/docs` |
| Health check | `http://localhost:3000/v1/health` |
| Full contract | `doc/api-endpoint-contract.md` |
| Interaction telemetry spec | `doc/plans/interaction-telemetry.md` |

**Backend default port:** `3000`  
**API prefix:** `/v1`  
**Redis:** Optional for local dev (`REDIS_ENABLED=false`); not required for auth/content/chat testing.

---

## 11. Out of scope for this integration

- Gamification APIs (leaderboards, XP, challenges)
- Guest mode (all content routes require Bearer today)
- `GET /v1/monuments/:id/panorama` — frontend-only panorama
- Direct TourBot / FastAPI calls from mobile

---

## 12. Sign-off

| Role | Action |
|------|--------|
| **Frontend lead** | Add `src/core/api/client.ts`, complete Phase A checklist |
| **Backend lead** | Ensure CORS origins include frontend dev URLs; keep API running on port 3000 |
| **QA** | Run section 9 checklist on web + one physical device |

Once Phase A passes, proceed B → E in order. Do not block on OAuth or push notifications — those routes are not live yet.
