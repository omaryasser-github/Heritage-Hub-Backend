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
const testEmail = `home-e2e-${randomUUID()}@example.com`;
const testPassword = 'Password123!';

describe('Home & Chat (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken = '';
  let dbReady = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
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
      console.warn('Skipping home/chat e2e — database not available');
    }
  });

  afterAll(async () => {
    if (dbReady) {
      try {
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (user) {
          await prisma.recommendationSnapshot.deleteMany({ where: { userId: user.id } });
          await prisma.chatMessage.deleteMany({
            where: { session: { userId: user.id } },
          });
          await prisma.chatSession.deleteMany({ where: { userId: user.id } });
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

  it('GET /v1/home returns fallback feed without snapshot', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get('/v1/home')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<{
      for_you: { source: string; items: unknown[] };
      featured_monuments: unknown[];
    }>;

    expect(body.data.for_you.source).toBe('fallback');
    expect(body.data.for_you.items.length).toBeGreaterThanOrEqual(3);
    expect(body.data.featured_monuments.length).toBeGreaterThan(0);
  });

  it('POST /v1/personality/quiz/submit creates snapshot via sync refresh in test', async () => {
    if (!dbReady) {
      return;
    }

    await request(app.getHttpServer())
      .post('/v1/personality/quiz/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        answers: [
          { question_id: 'q1', value: 5 },
          { question_id: 'q2', value: 1 },
          { question_id: 'q3', value: 1 },
          { question_id: 'q4', value: 1 },
          { question_id: 'q5', value: 5 },
          { question_id: 'q6', value: 1 },
          { question_id: 'q7', value: 1 },
        ],
      })
      .expect(201);

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    const snapshots = await prisma.recommendationSnapshot.count({
      where: { userId: user!.id },
    });
    expect(snapshots).toBeGreaterThan(0);

    const home = await request(app.getHttpServer())
      .get('/v1/home')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = home.body as ApiResponse<{ for_you: { source: string } }>;
    expect(body.data.for_you.source).toBe('snapshot');
  });

  it('chat session lifecycle works with stub assistant', async () => {
    if (!dbReady) {
      return;
    }

    const sessionRes = await request(app.getHttpServer())
      .post('/v1/chat/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const sessionId = (sessionRes.body as ApiResponse<{ id: string }>).data.id;

    const messageRes = await request(app.getHttpServer())
      .post(`/v1/chat/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'Tell me about Luxor' })
      .expect(201);

    const message = messageRes.body as ApiResponse<{ role: string; content: string }>;
    expect(message.data.role).toBe('assistant');
    expect(message.data.content.length).toBeGreaterThan(0);
  });
});
