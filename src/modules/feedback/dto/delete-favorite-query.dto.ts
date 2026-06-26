import { IsEnum, IsOptional } from 'class-validator';

export enum FavoriteTargetType {
  city = 'city',
  monument = 'monument',
}

export class DeleteFavoriteQueryDto {
  @IsOptional()
  @IsEnum(FavoriteTargetType)
  type?: FavoriteTargetType;
}
