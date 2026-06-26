import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from './pagination.dto';

export class SearchQueryDto extends PaginationQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  q!: string;
}

export class SearchSuggestionsQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  q!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  limit?: string;
}
