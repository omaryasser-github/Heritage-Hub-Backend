import { IsOptional, IsUUID } from 'class-validator';

export class ExclusiveTargetDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  monumentId?: string;
}
