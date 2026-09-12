const mongoose = require('mongoose');
const redisClient = require('../config/redis');

// A real health check, not just "200 OK". This is what you point
// UptimeRobot / Better Uptime at.
async function healthCheck(req, res) {
  const dbOk = mongoose.connection.readyState === 1;

  let redisOk = false;
  try {
    const pong = await redisClient.ping();
    redisOk = pong === 'PONG';
  } catch {
    redisOk = false;
  }

  const healthy = dbOk && redisOk;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db: dbOk,
    redis: redisOk,
    uptimeSeconds: Math.floor(process.uptime()),
  });
}

module.exports = { healthCheck };
