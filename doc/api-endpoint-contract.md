# Heritage Hub API — Contract Documentation

## Overview

A REST API for the **Heritage Hub** mobile app (React Native / Expo). It serves a **single mobile client** with **no BFF layer**, exposing resource-first endpoints (with light screen-aggregation only where round-trips hurt, e.g. `/home`). All cross-cutting conventions below are **locked** and apply across every endpoint.

## Architecture Decisions (locked)

- **No BFF layer** — single mobile client; resource-first aggregation, with screen-aggregation used only where round-trips hurt (e.g. `GET /home`).
    
- **No guest mode** — all endpoints require auth **except** `GET /app/config` and the `/auth/\\\\*` endpoints.
    
- **Auth model:** short-lived **access token** sent in the `Authorization: Bearer` header (held in client memory); long-lived **rotating refresh token** stored in client **SecureStore**. Refresh tokens are **DB-backed** with **rotation + reuse detection** via a **token family**. Revocation is handled at the **refresh layer** — there is **NO access-token blacklist**.
    
- **Localization:** detail responses return **both languages** (`name_en` / `name_ar`, etc.); list/summary responses may return the **preferred language only**. Assumes **2 languages**.
    
- **Timestamps:** raw **ISO 8601 UTC**; the client formats relative/display text (no server-side pre-formatting).
    
- **Monument & Template** share **one schema** with a **type discriminator** (`monument` | `template`) — same workflow, separate data.
    

## Global Conventions

- **Unified error envelope:**
    
    ``` json
          { "error": { "code": "STRING_ENUM", "message": "human readable", "details": {} } }
    
     ```
    
- **Empty list** = HTTP **200** with `{ "data": [] }` (never `null`, never 404). **Single resource not found** = **404** with the error envelope.
    
- **Cursor pagination** on all list endpoints: `?cursor=&limit=`; response `{ "data": [...], "cursor": "", "has_next": bool }`. The cursor is **opaque**.
    
- Entities carry **`updated_at`** (ISO 8601 UTC) to enable future caching / delta sync.
    

### Collection Variables

- `{{baseUrl}}` — base URL for the API (value left empty).
    
- `{{accessToken}}` — Bearer access token used for collection-level auth.
    

## Implemented Endpoints

### App Bootstrap

- `GET /app/config` — public bootstrap config (feature flags, min app version, etc.).
    

### Authentication

- `POST /auth/register` — create a new account.
    
- `POST /auth/login` — email/password login; returns token pair.
    
- `POST /auth/social` — social-provider login/registration.
    
- `POST /auth/refresh` — exchange refresh token for new access + rotated refresh token.
    
- `POST /auth/logout` — revoke current session's refresh token.
    
- `POST /auth/logout-all` — revoke all sessions for the user.
    
- `POST /auth/password/reset-request` — start password reset.
    
- `POST /auth/password/reset-confirm` — complete password reset with token.
    

### Devices & Push

- `POST /devices/push-token` — register/update the device push token.
    

### User Profile & Settings

- `GET /me` — current user profile.
    
- `PATCH /me` — update profile fields.
    
- `GET /me/settings` — fetch user settings.
    
- `PATCH /me/settings` — update user settings.
    

### Personality Quiz

- `GET /personality/quiz` — fetch the static personality quiz.
    
- `POST /personality/quiz/submit` — submit answers, derive personality.
    
- `GET /me/personality` — fetch the user's personality result.
    

### Home & Discovery

- `GET /home` — aggregated home screen.
    
- `GET /categories` — list content categories.
    
- `GET /search` — full search across items.
    
- `GET /search/suggestions` — typeahead suggestions.
    

### Cities

- `GET /cities` — paginated list of cities.
    
- `GET /cities/:cityId` — city detail.
    

### Monuments & Templates

- `GET /items` — paginated items (filter by `type`/`category`).
    
- `GET /items/:itemId` — item detail.
    
- `GET /items/:itemId/awareness` — awareness/educational content.
    
- `GET /items/:itemId/timeline` — historical timeline.
    
- `GET /items/:itemId/media` — media gallery.
    

### Panorama

- `GET /items/:itemId/panorama` — panorama scene + hotspots for an item.
    

### Quizzes

- `GET /items/:itemId/quizzes` — quizzes attached to an item.
    
- `GET /quizzes/:quizId` — quiz detail with questions.
    
- `POST /quizzes/:quizId/attempts` — submit a quiz attempt.
    

### Favorites

- `GET /me/favorites` — paginated favorites.
    
- `POST /favorites` — add an item to favorites.
    
- `DELETE /favorites/:itemId` — remove an item from favorites.
    

### Ratings & Reports

- `POST /ratings` — create/update a rating for an item.
    
- `POST /reports` — submit a content report.
    
- `GET /me/reports` — paginated list of the user's reports.
    

### Chatbot

- `GET /chat/sessions` — paginated chat sessions.
    
- `POST /chat/sessions` — start a new chat session.
    
- `GET /chat/sessions/:sessionId/messages` — paginated session messages.
    
- `POST /chat/sessions/:sessionId/messages` — send a message, get a reply.
    

### Notifications

- `GET /notifications` — paginated notifications.
    
- `POST /notifications/:notificationId/read` — mark a notification as read.
    

## Push Notification Payload Contract

Every push carries:

- **`id`** — stable, equal to the **NOTIFICATION** id; used for **dedupe + mark-as-read**.
    
- **`type`** — enum.
    
- **`target_id`** — the referenced resource id.
    
- **`deep_link`** — in-app deep link.
    

Payloads are **lightweight** (IDs + link only); the client refetches localized content via the API. **Dedupe** is done via the stable `id`.

## Deferred (templated only, not yet designed)

- **Caching strategy** (ETag / delta-sync) — entities already carry `updated_at`, so it can be added without breaking changes.
    
- **Panorama asset delivery internals** (equirectangular vs tiled, full hotspot media) — endpoint shape left open.
    
- **Chat streaming** — responses are synchronous for now; the contract is shaped so streaming can be added later.
    

## Future Work

- **Behavioral personality assessment** (`PERSONALITY_PROFILE` counters: `quizzes_counted`, `panoramas_counted`, `favorites_counted`, `interactions_counted`) — currently personality is set by an explicit **static quiz only**; counters are a planned second mechanism.
    
- **Guest mode / browse-before-login** — note: conflicts with current user stories **US-03 / US-03b** which assumed guest browsing; reconcile if revived.
    
- **Admin dashboards** — content management (US-38), feedback moderation (US-39), system analytics (US-40) — not part of the mobile client contract.
    
- **Push platform specifics** (iOS/Android behaviors) and notification delivery testing — to be **DOCUMENTED at delivery time** (QA concern), not part of the API contract.
    
- **Additional languages** — current localization-all-in-one assumes 2 languages; revisit payload strategy if a 3rd is added.
    

## Required Entity-Model Deltas (prerequisites noted)

- Add a **Device/Session** entity (holds the rotating refresh token/session **and** push token + platform + `last_seen`) — backbone shared by auth and notifications.
    
- **USER:** nullable `password_hash` + `auth_provider` field (for social-only accounts).
    
- **`updated_at`** on cacheable entities; **stable** **`id`** on NOTIFICATION.
    

## Update: Environments & Auth Token Migration

Three environments were created for the Heritage-Hub-API collection, each with a placeholder base URL and secret token variables:

| Variable | Heritage Hub – Dev | Heritage Hub – Staging | Heritage Hub – Prod |
| --- | --- | --- | --- |
| `baseUrl` (text) | `https://dev-api.heritagehub.example/v1` | `https://staging-api.heritagehub.example/v1` | `https://api.heritagehub.example/v1` |
| `accessToken` (secret) | empty | empty | empty |
| `refreshToken` (secret) | empty | empty | empty |

- The `accessToken` collection variable was removed from the Heritage-Hub-API collection. It now lives per-environment as a secret.
    
- `refreshToken` was added as a secret in each environment.
    
- The collection still keeps `baseUrl` as a fallback default, and the collection-level Bearer auth still references `{{accessToken}}`, which resolves from whichever environment is active.
    
- Login/Refresh scripts were left untouched (no auto-writing of tokens to the active environment yet).
    
- Base URLs are placeholders — replace them with real hostnames per environment when available.