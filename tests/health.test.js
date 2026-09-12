// Example test hitting app.js directly with supertest, no real
// server port needed. Mock Mongo/Redis connections in a real setup
// with something like mongodb-memory-server; this is a minimal
// smoke test to show the pattern.
const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('responds with a status field', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('status');
  });
});

describe('unknown route', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/this-route-does-not-exist');
    expect(res.statusCode).toBe(404);
  });
});

afterAll(async () => {
  const redisClient = require('../src/config/redis');
  await redisClient.quit();
});
