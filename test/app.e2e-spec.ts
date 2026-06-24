import { INestApplication } from '@nestjs/common';
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

describe('Phase 0 (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health returns 200 with data envelope', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    const body = res.body as ApiResponse<{ status: string; timestamp: string }>;

    expect(body.data).toMatchObject({ status: 'ok' });
    expect(body.data.timestamp).toBeDefined();
  });

  it('GET /v1/app/config returns bootstrap payload', async () => {
    const res = await request(app.getHttpServer()).get('/v1/app/config').expect(200);
    const body = res.body as ApiResponse<{
      min_supported_version: string;
      feature_flags: Record<string, boolean>;
    }>;

    expect(body.data.min_supported_version).toBeDefined();
    expect(body.data.feature_flags).toMatchObject({
      guest_mode: false,
      chat_enabled: true,
      recommendations_enabled: true,
    });
  });

  it('GET /v1/invalid returns NOT_FOUND error envelope', async () => {
    const res = await request(app.getHttpServer()).get('/v1/invalid').expect(404);
    const body = res.body as ErrorResponse;

    expect(body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Cannot GET /v1/invalid',
        details: {},
      },
    });
  });
});
