import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../core/database/prisma.service';
import { ValidatedInteractionEvent } from '../dto/interaction-event.validator';
import { INTERACTIONS_INGEST_QUEUE } from '../interactions.constants';

export interface InteractionIngestJobData {
  userId: string;
  events: ValidatedInteractionEvent[];
}

@Processor(INTERACTIONS_INGEST_QUEUE)
export class InteractionIngestProcessor extends WorkerHost {
  private readonly logger = new Logger(InteractionIngestProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<InteractionIngestJobData>): Promise<void> {
    const { userId, events } = job.data;

    try {
      await this.prisma.userInteraction.createMany({
        data: events.map((event) => ({
          eventId: event.eventId,
          userId,
          entityType: event.entityType,
          entityId: event.entityId,
          actionType: event.actionType,
          durationSeconds: event.durationSeconds,
          occurredAt: event.occurredAt,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      this.logger.error(`Failed to persist interaction batch for user ${userId}`, error);
      throw error;
    }
  }
}
