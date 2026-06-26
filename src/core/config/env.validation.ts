import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  APP_MIN_SUPPORTED_VERSION: Joi.string().default('1.0.0'),
  FEATURE_GUEST_MODE: Joi.string().valid('true', 'false').default('false'),
  FEATURE_CHAT_ENABLED: Joi.string().valid('true', 'false').default('true'),
  FEATURE_RECOMMENDATIONS_ENABLED: Joi.string().valid('true', 'false').default('true'),
  DATABASE_URL: Joi.string().uri().optional(),
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:5173'),
  THROTTLE_DEFAULT_TTL_MS: Joi.number().integer().min(1000).default(60000),
  THROTTLE_DEFAULT_LIMIT: Joi.number().integer().min(1).default(60),
  THROTTLE_AUTH_TTL_MS: Joi.number().integer().min(1000).default(60000),
  THROTTLE_AUTH_LIMIT: Joi.number().integer().min(1).default(10),
  JWT_ACCESS_SECRET: Joi.string().min(16).default('dev-access-secret-change-me'),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  AI_SERVICE_URL: Joi.string().uri().default('http://localhost:8000'),
  AI_SERVICE_API_KEY: Joi.string().default('dev-ai-key-change-me'),
  AI_SERVICE_TIMEOUT_MS: Joi.number().integer().min(1000).max(30000).default(5000),
  AI_SERVICE_USE_STUB: Joi.string().valid('true', 'false').default('true'),
});
