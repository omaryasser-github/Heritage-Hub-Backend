import { ConsoleLogger, Injectable, LoggerService, LogLevel } from '@nestjs/common';

@Injectable()
export class AppLoggerService extends ConsoleLogger implements LoggerService {
  constructor() {
    super('HeritageHub', {
      logLevels: AppLoggerService.resolveLogLevels(),
    });
  }

  private static resolveLogLevels(): LogLevel[] {
    const env = process.env.NODE_ENV ?? 'development';
    if (env === 'production') {
      return ['log', 'warn', 'error'];
    }
    return ['log', 'error', 'warn', 'debug', 'verbose'];
  }
}
