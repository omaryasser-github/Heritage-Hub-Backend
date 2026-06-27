export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  app: {
    minSupportedVersion: process.env.APP_MIN_SUPPORTED_VERSION ?? '1.0.0',
    featureFlags: {
      guest_mode: process.env.FEATURE_GUEST_MODE === 'true',
      chat_enabled: process.env.FEATURE_CHAT_ENABLED !== 'false',
      recommendations_enabled: process.env.FEATURE_RECOMMENDATIONS_ENABLED !== 'false',
    },
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  throttle: {
    defaultTtlMs: parseInt(process.env.THROTTLE_DEFAULT_TTL_MS ?? '60000', 10),
    defaultLimit: parseInt(process.env.THROTTLE_DEFAULT_LIMIT ?? '60', 10),
    authTtlMs: parseInt(process.env.THROTTLE_AUTH_TTL_MS ?? '60000', 10),
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '10', 10),
  },
  aiService: {
    url: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
    apiKey: process.env.AI_SERVICE_API_KEY ?? 'dev-ai-key-change-me',
    timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS ?? '5000', 10),
    useStub: process.env.AI_SERVICE_USE_STUB !== 'false',
  },
  aiChat: {
    url:
      process.env.AI_CHAT_URL ??
      process.env.AI_SERVICE_URL ??
      'https://nondesigned-alexis-unpliantly.ngrok-free.dev',
    timeoutMs: parseInt(process.env.AI_CHAT_TIMEOUT_MS ?? process.env.AI_SERVICE_TIMEOUT_MS ?? '30000', 10),
    useStub: process.env.AI_CHAT_USE_STUB === 'true',
  },
});
