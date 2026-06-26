import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayMaxSize, IsArray, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';

export class QuizAnswerDto {
  @IsString()
  question_id!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  value!: number;
}

export class QuizSubmitDto {
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
