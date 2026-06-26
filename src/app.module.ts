import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import configuration from './core/config/configuration';
import { envValidationSchema } from './core/config/env.validation';
import { PrismaModule } from './core/database/prisma.module';
import { AppBullModule } from './core/queue/bull.module';
import { AppThrottlerModule } from './core/security/app-throttler.module';
import { AppLoggerService } from './core/logger/logger.service';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExploreModule } from './modules/explore/explore.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PersonalityModule } from './modules/personality/personality.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { UsersModule } from './modules/users/users.module';
import { AppConfigController, HealthController } from './shared/controllers/health.controller';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { TraceInterceptor } from './shared/interceptors/trace.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    AppBullModule,
    AppThrottlerModule,
    AuthModule,
    UsersModule,
    ExploreModule,
    FeedbackModule,
    NotificationsModule,
    InteractionsModule,
    PersonalityModule,
    RecommendationsModule,
    AiChatModule,
  ],
  controllers: [HealthController, AppConfigController],
  providers: [
    AppLoggerService,
    TraceInterceptor,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
