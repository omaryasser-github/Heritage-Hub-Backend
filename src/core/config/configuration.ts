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
});
