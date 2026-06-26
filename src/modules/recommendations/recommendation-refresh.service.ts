import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RECOMMENDATIONS_REFRESH_QUEUE } from './recommendations.constants';
import { RecommendationsService } from './recommendations.service';

export interface RecommendationRefreshJobData {
  userId: string;
}

@Injectable()
export class RecommendationRefreshService {
  private readonly logger = new Logger(RecommendationRefreshService.name);

  constructor(
    @InjectQueue(RECOMMENDATIONS_REFRESH_QUEUE)
    private readonly refreshQueue: Queue<RecommendationRefreshJobData>,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  async enqueue(userId: string): Promise<void> {
    try {
      await this.refreshQueue.add(
        'refresh',
        { userId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } catch (error) {
      this.logger.warn(
        `BullMQ enqueue failed for user ${userId}; running synchronous refresh`,
        error instanceof Error ? error.message : String(error),
      );
      await this.recommendationsService.refreshSnapshotForUser(userId);
    }
  }
}
