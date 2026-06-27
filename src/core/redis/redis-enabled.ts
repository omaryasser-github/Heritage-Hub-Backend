/** When false, BullMQ and Redis-backed throttler are skipped; sync fallbacks apply. */
export function isRedisEnabled(): boolean {
  if (process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true') {
    return false;
  }

  return process.env.REDIS_ENABLED === 'true';
}
