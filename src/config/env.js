// Centralized, validated access to environment variables.
// Import this everywhere instead of reading process.env directly,
// so a missing var fails loudly at startup instead of silently in prod.
require('dotenv').config();

const required = ['MONGO_URI', 'REDIS_URL', 'JWT_SECRET', 'REFRESH_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // Fail fast on boot rather than crashing later mid-request.
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || '*',

  mongoUri: process.env.MONGO_URI,
  redisUrl: process.env.REDIS_URL,

  jwtSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.REFRESH_SECRET,

  thirdPartyApiBaseUrl: process.env.THIRD_PARTY_API_BASE_URL,
  thirdPartyApiKey: process.env.THIRD_PARTY_API_KEY,

  webhookSecret: process.env.WEBHOOK_SECRET,

  sentryDsn: process.env.SENTRY_DSN || null,
  logLevel: process.env.LOG_LEVEL || 'info',
};
