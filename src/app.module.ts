import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import configuration from './core/config/configuration';
import { envValidationSchema } from './core/config/env.validation';
import { PrismaModule } from './core/database/prisma.module';
import { AppLoggerService } from './core/logger/logger.service';
import { AuthModule } from './modules/auth/auth.module';
import { ExploreModule } from './modules/explore/explore.module';
import { UsersModule } from './modules/users/users.module';
import { AppConfigController, HealthController } from './shared/controllers/health.controller';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExploreModule,
  ],
  controllers: [HealthController, AppConfigController],
  providers: [
    AppLoggerService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
