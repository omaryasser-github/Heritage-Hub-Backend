import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/interfaces/authenticated-user.interface';
import { PaginationQueryDto } from '../../explore/dto/pagination.dto';
import { DeleteFavoriteQueryDto } from '../dto/delete-favorite-query.dto';
import { FavoriteCreateDto } from '../dto/favorite-create.dto';
import { FavoritesService } from '../services/favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  addFavorite(@CurrentUser() user: AuthenticatedUser, @Body() dto: FavoriteCreateDto) {
    return this.favoritesService.addFavorite(user.id, dto);
  }

  @Delete(':targetId')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Query() query: DeleteFavoriteQueryDto,
  ) {
    await this.favoritesService.removeFavorite(user.id, targetId, query.type);
    return { success: true };
  }
}

@Controller('me/favorites')
export class MeFavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  listFavorites(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.favoritesService.listFavorites(user.id, query.cursor, query.limit);
  }
}
