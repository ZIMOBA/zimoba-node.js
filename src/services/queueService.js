// Producer side of the job queue. Anything slow, bursty, or that
// hits a third-party API should be pushed here instead of run
// inline in the request/response cycle. The consumer lives in
// src/jobs/worker.js and can be scaled as a separate process.
const { Queue } = require('bullmq');
const redisClient = require('../config/redis');

const notificationQueue = new Queue('notifications', { connection: redisClient });

async function enqueueNotification(userId, payload) {
  await notificationQueue.add(
    'send-notification',
    { userId, payload },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 50, // keep last 50 failures for debugging
    }
  );
}

module.exports = { notificationQueue, enqueueNotification };
