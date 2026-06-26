import { InteractionActionType, InteractionEntityType } from '@prisma/client';
import { InteractionEventDto } from './interaction-batch.dto';
import { validateInteractionEvent } from './interaction-event.validator';

describe('validateInteractionEvent', () => {
  const baseEvent: InteractionEventDto = {
    event_id: '550e8400-e29b-41d4-a716-446655440001',
    action_type: InteractionActionType.view_monument,
    entity_type: InteractionEntityType.monument,
    entity_id: '550e8400-e29b-41d4-a716-446655440000',
    occurred_at: '2026-06-24T12:00:00.000Z',
    duration_seconds: 30,
  };

  it('accepts view_monument with duration', () => {
    const result = validateInteractionEvent(baseEvent);
    expect(result?.actionType).toBe(InteractionActionType.view_monument);
    expect(result?.durationSeconds).toBe(30);
  });

  it('rejects view_monument without duration', () => {
    const result = validateInteractionEvent({ ...baseEvent, duration_seconds: undefined });
    expect(result).toBeNull();
  });

  it('accepts search without duration', () => {
    const result = validateInteractionEvent({
      ...baseEvent,
      action_type: InteractionActionType.search,
      duration_seconds: undefined,
    });
    expect(result?.durationSeconds).toBeNull();
  });

  it('rejects search with duration', () => {
    const result = validateInteractionEvent({
      ...baseEvent,
      action_type: InteractionActionType.search,
      duration_seconds: 10,
    });
    expect(result).toBeNull();
  });
});
