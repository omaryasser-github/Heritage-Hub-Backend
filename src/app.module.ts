import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './core/config/configuration';
import { envValidationSchema } from './core/config/env.validation';
import { PrismaModule } from './core/database/prisma.module';
import { AppLoggerService } from './core/logger/logger.service';
import { AppConfigController, HealthController } from './shared/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
  ],
  controllers: [HealthController, AppConfigController],
  providers: [AppLoggerService],
})
export class AppModule {}
