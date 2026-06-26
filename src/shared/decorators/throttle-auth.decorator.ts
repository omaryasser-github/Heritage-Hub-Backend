import { Throttle } from '@nestjs/throttler';

export const ThrottleAuth = () => Throttle({ auth: { limit: 10, ttl: 60_000 } });
