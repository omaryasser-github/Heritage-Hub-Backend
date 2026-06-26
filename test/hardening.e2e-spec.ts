import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './helpers/e2e-app.factory';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

describe('Phase 7 hardening (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.THROTTLE_DEFAULT_LIMIT = '5';
    app = await createE2eApp({ swagger: true });
  });

  afterAll(async () => {
    delete process.env.THROTTLE_DEFAULT_LIMIT;
    await app.close();
  });

  it('rejects request bodies with undocumented fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'hardening@example.com',
        password: 'Password123!',
        unexpectedField: 'blocked',
      })
      .expect(400);

    const body = res.body as ErrorResponse;
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Validation failed');
  });

  it('returns 429 when default throttler limit is exceeded', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer()).get('/v1/app/config').expect(200);
    }

    const res = await request(app.getHttpServer()).get('/v1/app/config').expect(429);
    const body = res.body as ErrorResponse;
    expect(body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('serves Swagger UI at /v1/docs', async () => {
    const res = await request(app.getHttpServer()).get('/v1/docs/').expect(200);
    expect(res.text).toContain('swagger-ui');
  });

  it('includes Helmet security headers', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('returns x-request-id on every response', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(String(res.headers['x-request-id']).length).toBeGreaterThan(0);
  });

  it('echoes a client-provided x-request-id', async () => {
    const requestId = 'client-trace-12345';
    const res = await request(app.getHttpServer())
      .get('/v1/health')
      .set('x-request-id', requestId)
      .expect(200);

    expect(res.headers['x-request-id']).toBe(requestId);
  });
});
