# Phase 9: Deployment & Ops

## Objective
Package the application into optimized container images, automate deployment pipelines (CI/CD), and configure multi-environment (Dev, Staging, Prod) operational dashboards.

## Scope
*   **In Scope:**
    *   Write a multi-stage `Dockerfile` optimizing image sizes for Node.js production runs.
    *   Configure `docker-compose.yml` properties for environment orchestration.
    *   Create CI/CD workflow scripts (e.g., GitHub Actions) to run tests, build images, and deploy.
    *   Set up secure environment configurations across all three environments (Dev, Staging, Prod).
    *   Integrate secret management utilities (e.g., AWS Secrets Manager or secure vault configurations) to prevent credential leaks.
    *   Set up basic container logging, CPU/Memory alerts, and system backup cron jobs (database dumps).
*   **Out Scope:**
    *   Provisioning cloud infrastructure resources (Kubernetes/EC2/RDS instances) from scratch.

## Dependencies / Entry Criteria
- Codebase tested and functionally complete (Phase 8 green).
- Target hosting platform selected (AWS, Cloudflare, etc.).
- Access keys and registry namespaces provided.

## Folder Structure
```text
./ (Project Root)
├── Dockerfile                           # Multi-stage production container setup
├── docker-compose.prod.yml              # Prod database & network parameters
└── .github/
    └── workflows/
        └── deploy.yml                   # CI/CD deployment pipeline configuration
```

## Endpoints & Entities Touched
- Monitoring system hits the public `/v1/health` route.

## Acceptance Criteria
- [ ] Commits to the release branch trigger the CI/CD pipeline, passing test suites before initiating deployment.
- [ ] The production Docker image compiles successfully using non-root users (`node` user) for runtime security.
- [ ] Database backup cron jobs dump PostgreSQL files hourly and store them in secure, isolated storage locations.
- [ ] Environment secrets are injected into the runtime space securely without being saved to code repositories.
- [ ] API monitoring alerts trigger Slack or email notifications if the `/v1/health` endpoint returns a non-200 response for three consecutive checks.

## Risks & Open Questions
- Ensure proper database migration locks are in place during blue-green deployment runs to prevent migration scripts from executing concurrently on the same production tables.
