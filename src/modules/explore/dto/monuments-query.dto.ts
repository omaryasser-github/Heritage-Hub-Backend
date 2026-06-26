import { MonumentKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from './pagination.dto';

export class MonumentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  city_id?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(MonumentKind)
  kind?: MonumentKind = MonumentKind.monument;
}
