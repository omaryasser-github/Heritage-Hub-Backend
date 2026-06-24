# 🚀 Heritage Hub Backend

A modular, enterprise-grade REST API built with NestJS and TypeScript. It serves as the core gateway for the Heritage Hub mobile application, orchestrating user sessions, content synchronization, and proxying asynchronous recommendations to an external Python FastAPI AI service.

## 📦 Installation

```bash
git clone https://github.com/omaryasser-github/Heritage-Hub-Backend.git
cd Heritage-Hub-Backend
npm install
cp .env.example .env
```

## 🛠 Usage

```bash
docker-compose up -d
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Production: `npm run build` && `npm run start:prod`

## ✨ Features

- **Domain-Driven Modular Design:** Auth, Explore, Chat, Notifications — scalable and testable.
- **Refresh Token Rotation (RTR):** DB-backed family-key reuse detection.
- **Asynchronous Recommendations:** Background jobs + `RecommendationSnapshot` for sub-50ms reads.
- **Interaction Telemetry:** Batched events via Redis → BullMQ → PostgreSQL for AI signals.
- **Bilingual Payloads:** Arabic and English on dynamic fields.
- **Unified Error Envelope:** Predictable codes for frontend handling.

## 🧰 Tech Stack

- **Node.js & NestJS** — TypeScript-first backend
- **PostgreSQL** — relational storage
- **Prisma** — ORM and migrations ([ADR-002](doc/adr/ADR-002-prisma-orm.md))
- **Redis & BullMQ** — caching and background queues
- **Jest & Supertest** — unit and E2E tests

## 🤝 Contributing

Before contributing, review:

- [BACKEND_WORKFLOW.md](BACKEND_WORKFLOW.md) — architecture and code structure
- [API contract](doc/api-endpoint-contract.md) — routes and payload schemas
- [ADR index](doc/adr/README.md) — locked decisions (MVP scope, monuments, polymorphic FKs)
- [Implementation phases](doc/phases/overview.md) — step-by-step roadmap

Full product vision (not all MVP): `planing/req-analysis/` — see [ADR-003](doc/adr/ADR-003-mvp-scope.md).

## 📄 License

MIT License — see `LICENSE`.

## 🙌 Credits

Developed for the **Heritage Hub Platform** to bridge ancient Egyptian history with modern immersive technologies.
