import { InteractionActionType, InteractionEntityType } from '@prisma/client';
import { InteractionEventDto } from './interaction-batch.dto';

const DURATION_REQUIRED_ACTIONS = new Set<InteractionActionType>([
  InteractionActionType.view_monument,
  InteractionActionType.view_city,
  InteractionActionType.view_panorama,
]);

export interface ValidatedInteractionEvent {
  eventId: string;
  entityType: InteractionEntityType;
  entityId: string;
  actionType: InteractionActionType;
  durationSeconds: number | null;
  occurredAt: Date;
}

export function validateInteractionEvent(
  event: InteractionEventDto,
): ValidatedInteractionEvent | null {
  const requiresDuration = DURATION_REQUIRED_ACTIONS.has(event.action_type);

  if (requiresDuration) {
    if (event.duration_seconds === undefined || event.duration_seconds === null) {
      return null;
    }
  } else if (event.duration_seconds !== undefined) {
    return null;
  }

  const occurredAt = new Date(event.occurred_at);
  if (Number.isNaN(occurredAt.getTime())) {
    return null;
  }

  return {
    eventId: event.event_id,
    entityType: event.entity_type,
    entityId: event.entity_id,
    actionType: event.action_type,
    durationSeconds: requiresDuration ? event.duration_seconds! : null,
    occurredAt,
  };
}
