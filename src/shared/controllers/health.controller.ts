import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

@Controller('app')
export class AppConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Public()
  @Get('config')
  getConfig() {
    return {
      min_supported_version: this.configService.get<string>('app.minSupportedVersion', '1.0.0'),
      feature_flags: this.configService.get<Record<string, boolean>>('app.featureFlags', {}),
    };
  }
}
