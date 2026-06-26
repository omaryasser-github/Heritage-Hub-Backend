import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RecommendationRefreshJobData } from '../recommendation-refresh.service';
import { RECOMMENDATIONS_REFRESH_QUEUE } from '../recommendations.constants';
import { RecommendationsService } from '../recommendations.service';

@Processor(RECOMMENDATIONS_REFRESH_QUEUE)
export class RecommendationRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(RecommendationRefreshProcessor.name);

  constructor(private readonly recommendationsService: RecommendationsService) {
    super();
  }

  async process(job: Job<RecommendationRefreshJobData>): Promise<void> {
    try {
      await this.recommendationsService.refreshSnapshotForUser(job.data.userId);
    } catch (error) {
      this.logger.error(
        `Recommendation refresh job failed for user ${job.data.userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
