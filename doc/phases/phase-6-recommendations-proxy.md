# Phase 6: Recommendations Proxy (Pattern A Integration)

## Objective
Establish the HTTP bridge to the external Python FastAPI service, proxy user interaction signals, and cache recommendations inside PostgreSQL to enable high-speed client loads.

## Scope
*   **In Scope:**
    *   Configure NestJS `HttpModule` (Axios) with default network limits (timeouts, retries, headers).
    *   Implement inter-service security authentication between NestJS and FastAPI (shared API key or signed token exchange).
    *   Build service client modules to dispatch user signal parameters (e.g., personality profile, favorites, completed quiz stats) to FastAPI.
    *   Save recommendations payloads returned by FastAPI inside the `RecommendationSnapshot` database table.
    *   Expose `/v1/home` returning the cached recommendations under the "For You" feed.
    *   Implement graceful HTTP call retries and database-level fallbacks if the FastAPI service fails.
*   **Out Scope:**
    *   Implementing recommendations algorithms inside the NestJS project (all engine logic lives in the Python FastAPI code).
    *   Dynamic chat streaming services (proxied chatbot messaging is synchronous REST for the MVP; streaming is deferred).

## Dependencies / Entry Criteria
- Phase 5 (Personality Quiz) complete (needed to provide the input travel persona signals).
- API contract and endpoints finalized and agreed with the AI engineering team.
- Python FastAPI mock service running for staging integration.

## Folder Structure
```text
src/modules/
├── recommendations/
│   ├── recommendations.module.ts
│   ├── recommendations.service.ts
│   ├── controllers/
│   │   └── home.controller.ts           # Integrates feed cache and monuments
│   ├── clients/
│   │   └── ai-service.client.ts         # Handles REST communication with FastAPI
│   └── dto/
│       └── recommendation-response.dto.ts
└── ai-chat/
    ├── ai-chat.module.ts
    ├── ai-chat.controller.ts
    └── ai-chat.service.ts               # Proxies chatbot queries
```

## Endpoints & Entities Touched
- **Endpoints:**
  - `GET /v1/home` (Protected — aggregates explore monuments and recommendations)
  - `POST /v1/chat/sessions/:sessionId/messages` (Protected - proxies message to FastAPI)
- **Entities:**
  - `RecommendationSnapshot`
  - `ChatMessage`
  - `ChatSession`

## Acceptance Criteria
- [ ] Calling `GET /v1/home` returns the main explore feeds combined with a personalized "For You" list.
- [ ] If the FastAPI service is unresponsive, `GET /v1/home` does not crash and instead falls back to top-rated items fetched from local PostgreSQL.
- [ ] AI chatbot routes successfully proxy payloads to FastAPI and return conversational text answers within the latency budget (NFR-2).
- [ ] Out-of-service connections generate a clear logger warning and return a unified fallback message rather than raw network exceptions.

## Risks & Open Questions
- **Network Latency:** Synchronous HTTP calls to external LLMs and recommender endpoints can block connections. Ensure all calls use strict timeouts (e.g., maximum 5000ms limit) to prevent request pileup.
