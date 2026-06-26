import { IsString, MaxLength, MinLength } from 'class-validator';
import { SanitizeText } from '../../../shared/decorators/sanitize.decorator';

export class SendMessageDto {
  @SanitizeText()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;
}
