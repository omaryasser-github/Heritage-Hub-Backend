import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './helpers/e2e-app.factory';

interface ApiResponse<T> {
  data: T;
}

interface ErrorResponse {
  error: { code: string; message: string };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const prisma = new PrismaClient();
const testEmail = `quiz-e2e-${randomUUID()}@example.com`;
const testPassword = 'Password123!';

const validAnswers = [
  { question_id: 'q1', value: 5 },
  { question_id: 'q2', value: 1 },
  { question_id: 'q3', value: 1 },
  { question_id: 'q4', value: 1 },
  { question_id: 'q5', value: 5 },
  { question_id: 'q6', value: 1 },
  { question_id: 'q7', value: 1 },
];

describe('Personality quiz (e2e)', () => {
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
      console.warn('Skipping quiz e2e — database not available');
    }
  });

  afterAll(async () => {
    if (dbReady) {
      try {
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (user) {
          await prisma.personalityProfile.deleteMany({ where: { userId: user.id } });
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

  it('GET /v1/personality/quiz returns 7 localized questions', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get('/v1/personality/quiz')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<{
      questions: Array<{ id: string; prompt_en: string; prompt_ar: string; options: unknown[] }>;
    }>;

    expect(body.data.questions).toHaveLength(7);
    expect(body.data.questions[0].prompt_en).toBeDefined();
    expect(body.data.questions[0].prompt_ar).toBeDefined();
    expect(body.data.questions[0].options).toHaveLength(5);
  });

  it('POST /v1/personality/quiz/submit rejects invalid answer values', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .post('/v1/personality/quiz/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        answers: validAnswers.map((answer, index) =>
          index === 0 ? { ...answer, value: 6 } : answer,
        ),
      })
      .expect(400);

    const body = res.body as ErrorResponse;
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /v1/personality/quiz/submit saves profile and returns persona', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .post('/v1/personality/quiz/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers: validAnswers })
      .expect(201);

    const body = res.body as ApiResponse<{
      personality_type: string;
      personality_label: string;
      recommended_categories: string[];
    }>;

    expect(body.data.personality_type).toBe('explorer');
    expect(body.data.personality_label).toBe('Explorer');
    expect(body.data.recommended_categories.length).toBeGreaterThan(0);

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    const profile = await prisma.personalityProfile.findUnique({ where: { userId: user!.id } });
    expect(profile?.personalityType).toBe('explorer');
  });

  it('GET /v1/me/personality returns saved profile', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get('/v1/me/personality')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<{ personality_type: string; assessed_at: string }>;
    expect(body.data.personality_type).toBe('explorer');
    expect(body.data.assessed_at).toBeDefined();
  });
});
