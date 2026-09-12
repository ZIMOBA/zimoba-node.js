// Run this as a SEPARATE process from your API server:
//   npm run worker
// Keeping it separate means a slow or crashing job never takes
// down the HTTP server, and you can scale workers independently.
const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const { callThirdPartyApi } = require('../services/thirdPartyApiService');

const worker = new Worker(
  'notifications',
  async (job) => {
    const { userId, payload } = job.data;
    logger.info({ userId, jobId: job.id }, 'processing notification job');

    // Swap this for whatever third-party notification/email API you use.
    await callThirdPartyApi('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ userId, ...payload }),
    });
  },
  { connection: redisClient, concurrency: 5 }
);

worker.on('completed', (job) => logger.info({ jobId: job.id }, 'job completed'));
worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'job failed'));

logger.info('Notification worker started, waiting for jobs...');
