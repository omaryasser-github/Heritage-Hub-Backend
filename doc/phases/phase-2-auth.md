# Phase 2: Auth & Identity

## Objective
Implement registration, login, token rotation, and guard-based route access controls, ensuring secure API endpoints for the client application.

## Scope
*   **In Scope:**
    *   Implement user registration (`POST /v1/auth/register`) with password hashing (using `bcrypt` or `argon2id`).
    *   Implement credentials login (`POST /v1/auth/login`) returning JWT pairs (access token and refresh token).
    *   Build a `Session` (or `Device`) database entity to store hashed refresh tokens, device identifiers, and push tokens.
    *   Implement Refresh Token Rotation (RTR) on the `/v1/auth/refresh` endpoint with reuse detection logic.
    *   Build authentication guards (`JwtAuthGuard`, `RolesGuard`) and decorators (`@CurrentUser`, `@Roles`).
    *   Secure endpoints by default (interim: auth required except `@Public()` on `/app/config` and `/auth/*`). Guest mode deferred — [guest-mode-route-matrix.md](../guest-mode-route-matrix.md).
    *   Provide user profile routes (`GET /v1/me`, `PATCH /v1/me`).
*   **Out Scope:**
    *   Social Authentication integrations (Google, Facebook, Apple) (can be stubbed for Phase 2).
    *   Verification email dispatching logic (deferred to Phase 7).

## Dependencies / Entry Criteria
- Phase 1 (Data Layer & Migrations) complete with the `User` and `Session` tables created.
- Form field naming conventions reconciled between registration body payloads and user tables (e.g., matching frontend inputs with backend schema properties).

## Folder Structure
```text
src/modules/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts              # Valdates access tokens
│   │   └── refresh-token.strategy.ts    # Validates refresh tokens
│   └── guards/
│       ├── jwt-auth.guard.ts            # Protects routes by default
│       └── roles.guard.ts               # Restricts admin actions
└── users/
    ├── users.module.ts
    ├── users.controller.ts
    ├── users.service.ts
```

## Endpoints & Entities Touched
- **Endpoints:**
  - `POST /v1/auth/register` (Public)
  - `POST /v1/auth/login` (Public)
  - `POST /v1/auth/refresh` (Public - requires Bearer refresh token)
  - `POST /v1/auth/logout` (Protected - revokes refresh token)
  - `GET /v1/me` (Protected)
  - `PATCH /v1/me` (Protected)
- **Entities:**
  - `User`
  - `Session`

## Acceptance Criteria
- [ ] Registration saves password hashes (plain text passwords must never be logged or stored).
- [ ] Login returns `accessToken` (short-lived, 15m) and `refreshToken` (long-lived, 7d).
- [ ] Calling `/v1/auth/refresh` returns a newly rotated token pair and invalidates the previous refresh token.
- [ ] Reusing an old refresh token immediately invalidates the entire token family (deletes the parent `Session` record) and returns an HTTP 401.
- [ ] Protected endpoints block anonymous requests, returning a unified `UNAUTHORIZED` code.

## Risks & Open Questions
- Storing active session records requires cleanup routines to purge expired tokens from the database over time.
