# 🚀 Heritage Hub Backend

A modular, enterprise-grade REST API built with NestJS and TypeScript. It serves as the core gateway for the Heritage Hub mobile application, orchestrating user sessions, content synchronization, and proxying asynchronous recommendations to an external Python FastAPI AI service.

## 📦 Installation

Clone the repository and install the project dependencies:

```bash
git clone https://github.com/omaryasser-github/Heritage-Hub-Backend.git
cd Heritage-Hub-Backend
npm install
```

Set up your environment variables by copying the template file:

```bash
cp .env.example .env
```

## 🛠 Usage

Start the local PostgreSQL and Redis services (using Docker):

```bash
docker-compose up -d
```

Run database migrations and seed default content:

```bash
npx prisma migrate dev
npx prisma db seed
```

Run the application in development mode:

```bash
npm run start:dev
```

Compile the project and run in production mode:

```bash
npm run build
npm run start:prod
```

## ✨ Features

- **Domain-Driven Modular Design:** Clean separation of concerns (Auth, Explore, Chat, Notifications) facilitating scalability and test co-location.
- **Refresh Token Rotation (RTR):** High-security session tracking with DB-backed family-key reuse detection and instant invalidation.
- **Asynchronous Cache Invalidation:** Recommendations are processed in the background and served in sub-50ms reads from optimized JSONB tables.
- **High-Frequency Writes Buffering:** User interactions (zoom, duration, pans) are queued in Redis and bulk-written to reduce DB connection load.
- **Bilingual Payloads & Context Parsing:** Full support for Arabic and English strings on dynamic fields, facilitating LTR and RTL rendering on the mobile client.
- **Unified Error Envelope:** Standard exception intercepts returning predictable codes and payloads for clean frontend error handling.

## 🧰 Tech Stack

- **Node.js & NestJS:** TypeScript-first backend architecture
- **PostgreSQL:** Reliable relational transactional storage
- **Prisma / TypeORM:** Secure database-level query operations
- **Redis & BullMQ:** Fast in-memory caching and background job worker queues
- **Jest & Supertest:** Comprehensive unit and integration test suite

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change. 

Before contributing, please review:
- [BACKEND_WORKFLOW.md](file:///c:/Users/HP/Heritage-Hub-Backend/BACKEND_WORKFLOW.md) for architectural standards and code structure.
- [api-endpoint-contract.md](file:///c:/Users/HP/Heritage-Hub-Backend/doc/api-endpoint-contract.md) for API routes, payload structures, and response schema contracts.
- [Implementation Phases Index](file:///c:/Users/HP/Heritage-Hub-Backend/doc/phases/overview.md) for the step-by-step development roadmap.

## 📄 License

MIT License  
See `LICENSE` file for details.

## 🙌 Credits

Developed for the **Heritage Hub Platform** to bridge ancient Egyptian history with modern immersive technologies.
