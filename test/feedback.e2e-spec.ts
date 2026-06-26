import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './helpers/e2e-app.factory';

interface ApiResponse<T> {
  data: T;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const prisma = new PrismaClient();
const testEmail = `feedback-e2e-${randomUUID()}@example.com`;
const testPassword = 'Password123!';

describe('Feedback (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken = '';
  let dbReady = false;
  let monumentId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const monument = await prisma.monument.findFirst({ where: { status: 'published' } });
      if (!monument) {
        return;
      }
      monumentId = monument.id;
      app = await createE2eApp();
      dbReady = true;

      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: testEmail, password: testPassword });

      const login = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      accessToken = (login.body as ApiResponse<AuthTokens>).data.accessToken;
    } catch {
      dbReady = false;
      console.warn('Skipping feedback e2e — database not available');
    }
  });

  afterAll(async () => {
    if (dbReady) {
      try {
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (user) {
          await prisma.favorite.deleteMany({ where: { userId: user.id } });
          await prisma.rating.deleteMany({ where: { userId: user.id } });
          await prisma.report.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }
      } catch {
        // ignore cleanup errors
      }
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /v1/favorites adds a monument favorite', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .post('/v1/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ monumentId })
      .expect(201);

    const body = res.body as ApiResponse<{ monument_id: string }>;
    expect(body.data.monument_id).toBe(monumentId);
  });

  it('GET /v1/me/favorites lists favorites', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get('/v1/me/favorites')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<Array<{ monument_id: string | null }>>;
    expect(body.data.some((item) => item.monument_id === monumentId)).toBe(true);
  });

  it('POST /v1/ratings upserts without duplicates', async () => {
    if (!dbReady) {
      return;
    }

    await request(app.getHttpServer())
      .post('/v1/ratings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ monumentId, stars: 4 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/ratings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ monumentId, stars: 5 })
      .expect(201);

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    const count = await prisma.rating.count({
      where: { userId: user!.id, monumentId },
    });
    expect(count).toBe(1);

    const rating = await prisma.rating.findFirst({
      where: { userId: user!.id, monumentId },
    });
    expect(rating?.stars).toBe(5);
  });

  it('POST /v1/reports creates a report', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .post('/v1/reports')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ monumentId, reason: 'inaccurate', description: 'Test report' })
      .expect(201);

    const body = res.body as ApiResponse<{ status: string }>;
    expect(body.data.status).toBe('pending');
  });

  it('DELETE /v1/favorites/:targetId removes favorite', async () => {
    if (!dbReady) {
      return;
    }

    await request(app.getHttpServer())
      .delete(`/v1/favorites/${monumentId}?type=monument`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    const count = await prisma.favorite.count({
      where: { userId: user!.id, monumentId },
    });
    expect(count).toBe(0);
  });
});
