import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { setupSwagger } from './swagger';
import { HttpExceptionFilter } from '../shared/filters/http-exception.filter';
import { ResponseInterceptor } from '../shared/interceptors/response.interceptor';
import { TraceInterceptor } from '../shared/interceptors/trace.interceptor';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => {
      const details = errors.reduce<Record<string, string[]>>((acc, error) => {
        const messages = Object.values(error.constraints ?? {}).map(String);
        if (messages.length > 0) {
          acc[error.property] = messages;
        }
        return acc;
      }, {});

      return new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      });
    },
  });
}

export interface ConfigureHttpAppOptions {
  swagger?: boolean;
}

export function configureHttpApp(
  app: INestApplication,
  options: ConfigureHttpAppOptions = {},
): void {
  const configService = app.get(ConfigService);

  app.use(helmet());

  const origins = configService.get<string[]>('cors.origins', []);
  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
  });

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(app.get(TraceInterceptor), new ResponseInterceptor());

  const enableSwagger = options.swagger ?? configService.get<string>('nodeEnv') !== 'test';
  if (enableSwagger) {
    setupSwagger(app);
  }
}
