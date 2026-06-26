import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('social')
  socialLogin() {
    throw new NotImplementedException({
      code: 'NOT_IMPLEMENTED',
      message: 'Social login is not available in MVP yet',
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto.refreshToken);
    return { success: true };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logoutAll(user.id);
    return { success: true };
  }
}
