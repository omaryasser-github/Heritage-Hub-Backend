import { InteractionActionType, InteractionEntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class InteractionEventDto {
  @IsUUID()
  event_id!: string;

  @IsEnum(InteractionActionType)
  action_type!: InteractionActionType;

  @IsEnum(InteractionEntityType)
  entity_type!: InteractionEntityType;

  @IsUUID()
  entity_id!: string;

  @IsDateString()
  occurred_at!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration_seconds?: number;
}

export class InteractionBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InteractionEventDto)
  events!: InteractionEventDto[];
}
