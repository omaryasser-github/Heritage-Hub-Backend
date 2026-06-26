import { HttpModule } from '@nestjs/axios';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiServiceHttpClient } from './clients/ai-service.http';
import { AiServiceStubClient } from './clients/ai-service.stub';
import { HomeController } from './controllers/home.controller';
import { RecommendationRefreshProcessor } from './processors/recommendation-refresh.processor';
import { RecommendationRefreshService } from './recommendation-refresh.service';
import { AI_SERVICE_CLIENT, RECOMMENDATIONS_REFRESH_QUEUE } from './recommendations.constants';
import { RecommendationsService } from './recommendations.service';

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';

const bullQueueImports = isTestEnv
  ? []
  : [
      BullModule.registerQueue({
        name: RECOMMENDATIONS_REFRESH_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    ];

const refreshProviders = isTestEnv
  ? [
      RecommendationRefreshService,
      {
        provide: getQueueToken(RECOMMENDATIONS_REFRESH_QUEUE),
        useValue: {
          add: async () => {
            throw new Error('Redis unavailable in test environment');
          },
        },
      },
    ]
  : [RecommendationRefreshService, RecommendationRefreshProcessor];

@Module({
  imports: [HttpModule, ...bullQueueImports],
  controllers: [HomeController],
  providers: [
    RecommendationsService,
    AiServiceStubClient,
    AiServiceHttpClient,
    {
      provide: AI_SERVICE_CLIENT,
      inject: [ConfigService, AiServiceStubClient, AiServiceHttpClient],
      useFactory: (
        configService: ConfigService,
        stubClient: AiServiceStubClient,
        httpClient: AiServiceHttpClient,
      ) => (configService.get<boolean>('aiService.useStub', true) ? stubClient : httpClient),
    },
    ...refreshProviders,
  ],
  exports: [RecommendationsService, RecommendationRefreshService, AI_SERVICE_CLIENT],
})
export class RecommendationsModule {}
