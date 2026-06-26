import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INTERACTIONS_INGEST_QUEUE } from './interactions.constants';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { InteractionIngestProcessor } from './processors/interaction-ingest.processor';

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';

const bullImports = isTestEnv
  ? []
  : [
      BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          connection: {
            url: configService.get<string>('redis.url', 'redis://localhost:6379'),
            maxRetriesPerRequest: null,
            lazyConnect: true,
          },
        }),
      }),
      BullModule.registerQueue({
        name: INTERACTIONS_INGEST_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    ];

const bullProviders = isTestEnv
  ? [
      InteractionsService,
      {
        provide: getQueueToken(INTERACTIONS_INGEST_QUEUE),
        useValue: {
          add: async () => {
            throw new Error('Redis unavailable in test environment');
          },
        },
      },
    ]
  : [InteractionsService, InteractionIngestProcessor];

@Module({
  imports: bullImports,
  controllers: [InteractionsController],
  providers: bullProviders,
})
export class InteractionsModule {}
