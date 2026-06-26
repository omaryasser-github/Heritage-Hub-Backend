import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './helpers/e2e-app.factory';

interface ApiResponse<T> {
  data: T;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const prisma = new PrismaClient();
const testEmail = `auth-e2e-${randomUUID()}@example.com`;
const testPassword = 'Password123!';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dbReady = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.user.count();
      app = await createE2eApp();
      dbReady = true;
    } catch {
      dbReady = false;
      console.warn(
        'Skipping auth e2e — ensure DATABASE_URL is set and run: npx prisma migrate deploy',
      );
    }
  });

  afterAll(async () => {
    if (dbReady) {
      try {
        await prisma.user.deleteMany({ where: { email: testEmail } });
      } catch {
        // ignore cleanup errors
      }
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /v1/auth/register returns token pair', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    const body = res.body as ApiResponse<AuthTokens>;
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toContain('.');

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe(testPassword);
    expect(await bcrypt.compare(testPassword, user!.passwordHash!)).toBe(true);
  });

  it('POST /v1/auth/login returns token pair', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    const body = res.body as ApiResponse<AuthTokens>;
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
  });

  it('GET /v1/me requires authentication', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer()).get('/v1/me').expect(401);
    const body = res.body as ErrorResponse;
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /v1/me returns profile with valid access token', async () => {
    if (!dbReady) {
      return;
    }

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const tokens = (login.body as ApiResponse<AuthTokens>).data;

    const res = await request(app.getHttpServer())
      .get('/v1/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<{ email: string }>;
    expect(body.data.email).toBe(testEmail);
  });

  it('POST /v1/auth/refresh rotates tokens and invalidates old refresh token', async () => {
    if (!dbReady) {
      return;
    }

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const initial = (login.body as ApiResponse<AuthTokens>).data;

    const refresh = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: initial.refreshToken })
      .expect(200);

    const rotated = (refresh.body as ApiResponse<AuthTokens>).data;
    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(initial.refreshToken);

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: initial.refreshToken })
      .expect(401);
  });

  it('POST /v1/auth/refresh reuse revokes token family', async () => {
    if (!dbReady) {
      return;
    }

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const first = (login.body as ApiResponse<AuthTokens>).data;
    const rotated = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken });

    const second = (rotated.body as ApiResponse<AuthTokens>).data;

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: second.refreshToken })
      .expect(401);
  });

  it('POST /v1/auth/logout revokes refresh token', async () => {
    if (!dbReady) {
      return;
    }

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    const tokens = (login.body as ApiResponse<AuthTokens>).data;

    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .send({ refreshToken: tokens.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(401);
  });
});
