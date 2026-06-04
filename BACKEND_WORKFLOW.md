# Heritage Hub — Backend Development Workflow

> **Platform:** Node.js (NestJS Framework)  
> **Language:** TypeScript  
> **Database:** PostgreSQL (with Prisma or TypeORM)  
> **AI Integration (Pattern A):** External Python (FastAPI) HTTP client proxy  
> **Localization:** Bilingual (Arabic / English) payload support

---

## 1. Backend Overview

The Heritage Hub backend is a **modular REST API** built with NestJS and TypeScript. It serves as the single source of truth and primary gateway for the React Native (Expo) mobile client. 

The backend is responsible for:
- Implementing secure user authentication (OAuth 2.0 social log-ins & database-backed Refresh Token Rotation).
- Providing CRUD operations and filtering for cities, monuments, categories, and timelines.
- Serving 360° panorama metadata and coordinate-based hotspots.
- Proxying and caching requests to the separate Python FastAPI service for AI-generated content (chatbot, quiz generation, recommendation snapshot updates).
- Processing, buffering, and logging high-frequency user interactions for AI model training.
- Dispatching push notifications to iOS and Android devices.

The app communicates with the mobile client exclusively through a clean, unified REST interface with no BFF (Backend-for-Frontend) layer.

---

## 2. Architecture Approach

The backend follows a **Modular / Domain-Driven Architecture** native to NestJS. Instead of separating files purely by technical layer (e.g., placing all controllers in a single folder), we group modules by business domain.

### 3-Tier Layer Structure
1. **Controllers (Entry Point):** Responsible for HTTP routing, request binding, and DTO validation. They should remain thin and pass validated inputs to the Service layer.
2. **Services (Business Logic):** Houses the core business rules, transactional logic, and communications with external APIs (like the FastAPI AI service).
3. **Data Access Layer (ORM / Prisma):** Manages queries to PostgreSQL, database integrity constraints, and cascading rules.

---

## 3. Folder Structure (High-Level)

```
src/
├── main.ts                # Application entry point & global configuration
├── app.module.ts          # Root module importing all feature modules
│
├── core/                  # Global singletons and configurations
│   ├── config/            # Environment variable bindings & validation
│   ├── database/          # Database connection client (Prisma/TypeORM setup)
│   ├── security/          # JWT configuration, CORS options, and hashing helpers
│   └── logger/            # Custom application logger
│
├── shared/                # Highly reusable, domain-agnostic utilities
│   ├── decorators/        # Custom decorators (e.g., @CurrentUser, @Public)
│   ├── dtos/              # Core reusable DTOs (e.g., PaginationQueryDto)
│   ├── filters/           # Global exception filter (Unified Error Envelope)
│   ├── guards/            # Access control (JwtAuthGuard, RolesGuard)
│   └── interceptors/      # Language mapping & execution timing interceptors
│
└── modules/               # Domain-driven feature modules (Modular structure)
    ├── auth/              # Login, Register, Social Auth, Token Rotation
    ├── users/             # Profile management, Settings, Favorites list
    ├── explore/           # Cities, Monuments, Panoramas, Hotspots, Timelines
    ├── personality/       # Onboarding quiz data, submissions, assessments
    ├── ai-chat/           # Chat session records, messaging, and FastAPI proxy
    ├── recommendations/   # Recommendation Snapshot builder & proxy
    ├── notifications/     # Read/unread inbox and push dispatcher
    └── feedback/          # Ratings, content reports, admin response panel
```

By encapsulating logic inside distinct modules (e.g., `modules/auth`), we can scale features independently or eventually break out heavy modules (like `ai-chat` or `recommendations`) into microservices without restructuring the rest of the application.

---

## 4. Development Workflow

Development progresses in the following stages:

### Stage 0 — Living Documentation Setup
- Establish and keep the `doc/api-endpoint-contract.md` updated as endpoints evolve.
- Maintain environment variables in Postman/Insomnia profiles for automated API validation.

### Stage 1 — Infrastructure & Database Setup
- Initialize the NestJS template with TypeScript, ESLint, and Prettier.
- Configure PostgreSQL database connections using Docker for local dev.
- Write the Prisma schema (or TypeORM entities) and apply the initial migration.
- Create seed scripts with realistic historical content to unblock the frontend.

### Stage 2 — Authentication & Base Security
- Implement the JWT authentication system (Short-lived Access Tokens + DB-backed Rotating Refresh Tokens).
- Add Request Validation pipes using `class-validator` and `class-transformer`.
- Set up the global `HttpExceptionFilter` to enforce the **Unified Error Envelope**.
- Integrate OAuth 2.0 social login routes (Google, Facebook, Apple).

### Stage 3 — Core Content API (CRUD)
- Implement endpoints for Cities, Categories, Monuments, and Timelines.
- Write cursor-based pagination logic for long lists (e.g., monument feeds).
- Set up file upload handlers with image compression (e.g., converting 360° panoramas into WebP/AVIF textures at 2K, 4K, and 8K tiers).

### Stage 4 — AI Service & Gateway Integrations
- Integrate the NestJS `HttpModule` (Axios wrapper) to proxy requests to the Python FastAPI microservice.
- Implement the chatbot agent endpoint and set up Server-Sent Events (SSE) for streaming text generation.
- Build the asynchronous recommendation background worker to update `RecommendationSnapshot` cache tables.

### Stage 5 — Gamification, Notifications & Feedback
- Build the rating and content-inaccuracy reporting systems.
- Integrate Expo / Firebase push notification tokens and payload structures.
- Set up background queues (e.g., `BullMQ` + Redis) to handle non-blocking operations like email dispatch, interaction logging, and notification batches.

### Stage 6 — Production QA & Optimization
- Run database index tuning (especially on high-read search queries and foreign keys).
- Execute API integration tests (E2E) on critical paths (Auth, Quiz submission, Chat).
- Deploy to Staging/Production environments using standard CI/CD pipelines.

---

## 5. API & System Design Focus

The backend performance directly impacts the **100ms UI response time** requirement (NFR-3) and the **1.5s–3s AI budget** (NFR-2).

**Key principles:**

- **Unified Error Envelope:** All errors are caught by a global exception filter and mapped to a standardized response structure:
  ```json
  {
    "error": {
      "code": "EMAIL_ALREADY_EXISTS",
      "message": "The email address is already registered.",
      "details": {}
    }
  }
  ```
- **Referential Integrity over Polymorphism:** To bypass ORM compatibility issues (specifically Prisma's lack of native generic polymorphism), polymorphic entities like `MEDIA_ASSET` must use **exclusive nullable foreign keys** (e.g., `city_id` and `monument_id` columns with a check constraint) rather than a generic string `entity_id` + `entity_type`.
- **Latency Optimization via Caching:** The NestJS API Gateway must not compute recommendations or parse complex metrics synchronously. Heavy computations must run as background jobs, caching the output in `RECOMMENDATION_SNAPSHOT` so client reads take `< 50ms`.
- **Interaction Data Buffering:** To prevent database connection saturation from high-frequency touch/zoom logging, the backend exposes a batched intake route. Log requests are buffered in Redis before being written to PostgreSQL in micro-batches.
- **Security BCP (Refresh Token Rotation):** If a refresh token is reused, the backend instantly invalidates the entire token family (deletes the active `Session` record) to mitigate credential theft.

---

## 6. State & Cache Strategy

State is divided into three layers:

| Layer | Tool | Purpose |
|---|---|---|
| **Transactional / Relational** | PostgreSQL | Users, profiles, cities, monuments, reports, timelines, chat history |
| **Volatile / Caching** | Redis | API rate-limiting, user session tokens, lockouts, task queues |
| **Asynchronous AI Results** | DB JSONB Snapshots | Cached recommender outputs (`RECOMMENDATION_SNAPSHOT`) |

---

## 7. Routing & Endpoint Strategy

The route namespace matches the feature slices defined in the frontend navigation structure:

```
/v1
├── /auth            → login, register, refresh, logout, social
├── /me              → profile, settings, favorites, reports, personality
├── /cities          → list (paginated), details
├── /items           → list (by city/category), details, timeline, media, panorama
├── /personality     → quiz configuration, submission
├── /chat            → sessions, message exchange
├── /ratings         → upsert content ratings
├── /reports         → content inaccuracy tickets
└── /notifications   → list (unread/read), mark-read, register-push-token
```

- **Localization:** List endpoints inspect the client `Accept-Language` header to return English or Arabic. Detail views return both languages (`name_en` / `name_ar`) to support instant layout flipping on the frontend.
- **Pagination:** List operations require cursor-based pagination parameters `?cursor=&limit=` using base64 encoded opaque values.

---

## 8. Best Practices

### Clean Code
- Explicit typing across all layers; no `any`.
- Strictly enforce request payloads via DTOs decorated with `class-validator`.
- Services must remain database-engine-agnostic; query logic is isolated.

### Scalability
- Long-running processes (e.g., sending verification emails, notifying FastAPI of new interactions) must be offloaded to `BullMQ` background processes.
- Large database tables (like `USER_INTERACTION`) should be indexed on `user_id` and `created_at` to avoid full-table scans.

### Security
- Passwords must be hashed using `bcrypt` or `argon2id` with a high work factor.
- Enforce strict CORS policies allowing only the mobile client's origin or native schemes.
- Implement rate limiting (using `@nestjs/throttler` + Redis) on sensitive auth endpoints.

---

## 9. Testing Strategy (MVP-Level)

> **Philosophy:** Test what matters. Ship fast. Don't over-engineer.  
> Focus on business critical flows, security, and input boundaries.

### 🛠️ Minimal Stack — 2 Tools Only

| Tool | Purpose |
|---|---|
| **Jest** | Unit testing for custom services, calculations, and validators |
| **Supertest** | E2E and integration tests to verify API endpoints, guards, and DB writes |

---

### ✅ What to Test (Critical Only)

**Test these:**
- Auth guard validation (unauthorized requests return HTTP 401).
- Refresh Token Rotation logic (token reuse invalidates session).
- Form payload validations (invalid emails/missing inputs return HTTP 400).
- Quiz scoring calculation logic.
- External API gateway failover (mocking FastAPI downstream failure).
- Database cascading behaviors on delete operations.

**Do NOT test:**
- Third-party library internals (e.g., verifying database drivers connect).
- Native Express/Fastify server configuration properties.
- Unchanged boilerplates.

---

### 📋 Practical Workflow

**Co-locate spec files next to the file they test:**
```
src/
└── modules/
    └── auth/
        ├── auth.service.ts
        ├── auth.service.spec.ts   ← right next to the service
        ├── auth.controller.ts
        └── auth.controller.spec.ts
```

- Run unit tests locally with `npm run test`.
- Run E2E suites with `npm run test:e2e` inside local test databases before merging pull requests.
