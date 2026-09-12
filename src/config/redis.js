// Single shared Redis connection used for caching, rate limiting,
// and as the BullMQ queue backend. Import this instead of creating
// new connections everywhere.
const Redis = require('ioredis');
const { redisUrl } = require('./env');
const logger = require('../utils/logger');

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // required by BullMQ
});

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (err) => logger.error({ err }, 'Redis connection error'));

module.exports = redisClient;
