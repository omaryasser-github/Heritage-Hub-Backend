import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureHttpApp } from '../../src/bootstrap/configure-http-app';

export interface CreateE2eAppOptions {
  swagger?: boolean;
}

export async function createE2eApp(
  options: CreateE2eAppOptions = {},
): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  configureHttpApp(app, { swagger: options.swagger });
  await app.init();
  return app;
}
