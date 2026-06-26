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
  JWT_ACCESS_SECRET: Joi.string().min(16).default('dev-access-secret-change-me'),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
});
