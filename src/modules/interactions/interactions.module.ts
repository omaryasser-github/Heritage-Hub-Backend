import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { isRedisEnabled } from '../../core/redis/redis-enabled';
import { INTERACTIONS_INGEST_QUEUE } from './interactions.constants';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { InteractionIngestProcessor } from './processors/interaction-ingest.processor';

const bullQueueImports = isRedisEnabled()
  ? [
      BullModule.registerQueue({
        name: INTERACTIONS_INGEST_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    ]
  : [];

const bullProviders = isRedisEnabled()
  ? [InteractionsService, InteractionIngestProcessor]
  : [
      InteractionsService,
      {
        provide: getQueueToken(INTERACTIONS_INGEST_QUEUE),
        useValue: {
          add: async () => {
            throw new Error('Redis disabled — using synchronous persistence');
          },
        },
      },
    ];

@Module({
  imports: bullQueueImports,
  controllers: [InteractionsController],
  providers: bullProviders,
})
export class InteractionsModule {}
