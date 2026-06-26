import { InjectQueue } from '@nestjs/bullmq';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../../core/database/prisma.service';
import {
  InteractionBatchDto,
} from './dto/interaction-batch.dto';
import { validateInteractionEvent, ValidatedInteractionEvent } from './dto/interaction-event.validator';
import {
  INTERACTION_RATE_LIMIT_PER_MINUTE,
  INTERACTIONS_INGEST_QUEUE,
  MAX_INTERACTION_BATCH_SIZE,
} from './interactions.constants';
import { InteractionIngestJobData } from './processors/interaction-ingest.processor';

export interface InteractionBatchResult {
  accepted: number;
  rejected: number;
}

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);
  private readonly requestTimestamps = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(INTERACTIONS_INGEST_QUEUE) private readonly ingestQueue: Queue<InteractionIngestJobData>,
  ) {}

  async submitBatch(userId: string, dto: InteractionBatchDto): Promise<InteractionBatchResult> {
    this.assertRateLimit(userId);

    if (dto.events.length > MAX_INTERACTION_BATCH_SIZE) {
      throw new PayloadTooLargeException({
        code: 'PAYLOAD_TOO_LARGE',
        message: `Batch cannot exceed ${MAX_INTERACTION_BATCH_SIZE} events`,
      });
    }

    const acceptedEvents: ValidatedInteractionEvent[] = [];
    let rejected = 0;

    for (const event of dto.events) {
      const validated = validateInteractionEvent(event);
      if (!validated) {
        rejected += 1;
        continue;
      }
      acceptedEvents.push(validated);
    }

    if (acceptedEvents.length > 0) {
      await this.enqueueOrPersist(userId, acceptedEvents);
    }

    return { accepted: acceptedEvents.length, rejected };
  }

  private async enqueueOrPersist(
    userId: string,
    events: ValidatedInteractionEvent[],
  ): Promise<void> {
    const jobData: InteractionIngestJobData = { userId, events };

    try {
      await this.ingestQueue.add('ingest', jobData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      });
    } catch (error) {
      this.logger.warn(
        `BullMQ enqueue failed for user ${userId}; falling back to synchronous insert`,
        error instanceof Error ? error.message : String(error),
      );
      await this.persistEvents(userId, events);
    }
  }

  private async persistEvents(
    userId: string,
    events: ValidatedInteractionEvent[],
  ): Promise<void> {
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
  }

  private assertRateLimit(userId: string): void {
    const now = Date.now();
    const windowMs = 60_000;
    const timestamps = (this.requestTimestamps.get(userId) ?? []).filter(
      (timestamp) => now - timestamp < windowMs,
    );

    if (timestamps.length >= INTERACTION_RATE_LIMIT_PER_MINUTE) {
      throw new HttpException(
        {
          code: 'TOO_MANY_REQUESTS',
          message: 'Interaction batch rate limit exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.requestTimestamps.set(userId, timestamps);
  }
}
