import { ReportReason } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeText } from '../../../shared/decorators/sanitize.decorator';
import { ExclusiveTargetDto } from './exclusive-target.dto';

export class ReportCreateDto extends ExclusiveTargetDto {
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsOptional()
  @SanitizeText()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
