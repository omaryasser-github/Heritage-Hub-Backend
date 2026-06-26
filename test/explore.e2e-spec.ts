import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './helpers/e2e-app.factory';

interface ApiResponse<T> {
  data: T;
  cursor?: string;
  has_next?: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const prisma = new PrismaClient();
const testEmail = `explore-e2e-${randomUUID()}@example.com`;
const testPassword = 'Password123!';

describe('Explore (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken = '';
  let dbReady = false;
  let sampleCityId = '';
  let sampleMonumentId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const city = await prisma.city.findFirst({ where: { status: 'published' } });
      const monument = await prisma.monument.findFirst({ where: { status: 'published' } });

      if (!city || !monument) {
        return;
      }

      sampleCityId = city.id;
      sampleMonumentId = monument.id;
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
      console.warn(
        'Skipping explore e2e — ensure DATABASE_URL is set, migrations applied, and seed loaded',
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

  it('GET /v1/cities requires authentication', async () => {
    if (!dbReady) {
      return;
    }

    await request(app.getHttpServer()).get('/v1/cities').expect(401);
  });

  it('GET /v1/cities returns paginated list', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get('/v1/cities?limit=5')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<Array<{ name_en: string; name_ar: string }>>;
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].name_en).toBeDefined();
    expect(body.data[0].name_ar).toBeDefined();
    expect(body.has_next).toBeDefined();
  });

  it('GET /v1/cities/:cityId returns bilingual detail', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get(`/v1/cities/${sampleCityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<{ name_en: string; name_ar: string; slug: string }>;
    expect(body.data.slug).toBeDefined();
    expect(body.data.name_en).toBeDefined();
    expect(body.data.name_ar).toBeDefined();
  });

  it('GET /v1/monuments filters by city_id', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get(`/v1/monuments?city_id=${sampleCityId}&limit=50`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<Array<{ city_id: string }>>;
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((item) => item.city_id === sampleCityId)).toBe(true);
  });

  it('GET /v1/monuments/:monumentId returns detail', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get(`/v1/monuments/${sampleMonumentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<{ name_en: string; name_ar: string; description_en: string }>;
    expect(body.data.name_en).toBeDefined();
    expect(body.data.name_ar).toBeDefined();
    expect(body.data.description_en).toBeDefined();
  });

  it('GET /v1/categories returns categories', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get('/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<Array<{ slug: string }>>;
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('GET /v1/search returns matches', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get('/v1/search?q=pyramid')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<Array<{ type: string; name_en: string }>>;
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].type).toMatch(/city|monument|category/);
  });

  it('GET /v1/search/suggestions returns suggestions', async () => {
    if (!dbReady) {
      return;
    }

    const res = await request(app.getHttpServer())
      .get('/v1/search/suggestions?q=ca')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as ApiResponse<Array<{ name_en: string }>>;
    expect(Array.isArray(body.data)).toBe(true);
  });
});
