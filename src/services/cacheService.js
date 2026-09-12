// Generic cache-aside helper: check Redis first, fall back to the
// real fetch function, then store the result for next time.
const redisClient = require('../config/redis');

async function getCachedOrFetch(key, fetchFn, ttlSeconds = 300) {
  const cached = await redisClient.get(key);
  if (cached) return JSON.parse(cached);

  const fresh = await fetchFn();
  await redisClient.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  return fresh;
}

async function invalidate(key) {
  await redisClient.del(key);
}

module.exports = { getCachedOrFetch, invalidate };
