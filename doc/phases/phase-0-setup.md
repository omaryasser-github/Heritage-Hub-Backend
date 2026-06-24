# Phase 0: Foundation & Project Setup

## Objective
Establish a clean, standardized NestJS codebase scaffold with environment configurations, a health-check endpoint, and a global Unified Error Envelope.

## Scope
*   **In Scope:**
    *   Initialize NestJS framework project structure.
    *   Set up TypeScript, ESLint, and Prettier configurations.
    *   Configure `ConfigModule` for environment validation (using `joi` or `class-validator` schema).
    *   Build a custom logger service matching application standards.
    *   Enforce a global `/v1` route prefix.
    *   Create a global `HttpExceptionFilter` to map all failures to the Unified Error Envelope.
    *   Implement a global `ResponseInterceptor` to wrap standard data responses.
    *   Add public `/v1/health` and `/v1/app/config` endpoints (bootstrap: feature flags, min app version).
*   **Out Scope:**
    *   Database migrations or model definitions (deferred to Phase 1).
    *   Authentication guards (deferred to Phase 2).

## Dependencies / Entry Criteria
- Confirm NestJS as the backend framework (Completed).
- Choose local database engines (Dockerized PostgreSQL & Redis).

## Folder Structure
During this phase, the following folder layout is initialized:
```text
src/
├── main.ts                      # App bootstrapper (prefix, filters, validation)
├── app.module.ts                # Root module importing configuration modules
├── core/
│   ├── config/
│   │   ├── configuration.ts     # Config objects
│   │   └── env.validation.ts    # Joi schema validation for .env
│   ├── database/
│   │   └── prisma.module.ts       # Prisma client (ADR-002)
│   └── logger/
│       └── logger.service.ts    # Application custom logger
└── shared/
    ├── controllers/
    │   └── health.controller.ts # Public health checks
    ├── filters/
    │   └── http-exception.filter.ts # Unified Error Envelope formatter
    └── interceptors/
        └── response.interceptor.ts  # Standard { data: ... } wrapper
```

## Endpoints & Entities Touched
- **Endpoints:**
  - `GET /v1/health` (Public, no auth)
  - `GET /v1/app/config` (Public, no auth)
- **Entities:**
  - None

## Acceptance Criteria
- [ ] Application builds without linting or compiler errors.
- [ ] Running `npm run start` successfully starts the HTTP server.
- [ ] `GET /v1/health` returns status `200 OK` wrapped in the standard response format.
- [ ] Requesting a non-existent URL returns standard 404 Unified Error Envelope:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Cannot GET /v1/invalid",
      "details": {}
    }
  }
  ```

## Risks & Open Questions
- Every future endpoint must use the validation decorator to ensure validation errors are caught and converted correctly into the Unified Error Envelope details field.
