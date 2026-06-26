import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { AppLanguage } from '../../../shared/enums/app-language.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(AppLanguage)
  language?: AppLanguage;
}
