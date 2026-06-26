import { IsInt, Max, Min } from 'class-validator';
import { ExclusiveTargetDto } from './exclusive-target.dto';

export class RatingUpsertDto extends ExclusiveTargetDto {
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;
}
