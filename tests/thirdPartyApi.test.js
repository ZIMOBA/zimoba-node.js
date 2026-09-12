// The service uses native fetch (built on undici), which nock does
// not reliably intercept. undici's own MockAgent is the correct
// tool for mocking fetch calls.
const { MockAgent, setGlobalDispatcher, getGlobalDispatcher } = require('undici');

process.env.THIRD_PARTY_API_BASE_URL = 'https://api.fake-upstream.test';
process.env.THIRD_PARTY_API_KEY = 'test-key';

const { callThirdPartyApi } = require('../src/services/thirdPartyApiService');

let mockAgent;
let originalDispatcher;

beforeEach(() => {
  mockAgent = new MockAgent();
  mockAgent.disableNetConnect(); // any un-mocked request fails loudly instead of hitting the real network
  originalDispatcher = getGlobalDispatcher();
  setGlobalDispatcher(mockAgent);
});

afterEach(async () => {
  await mockAgent.close();
  setGlobalDispatcher(originalDispatcher);
});

describe('callThirdPartyApi', () => {
  it('returns parsed JSON on success', async () => {
    const pool = mockAgent.get('https://api.fake-upstream.test');
    pool.intercept({ path: '/ping', method: 'GET' }).reply(200, { ok: true });

    const result = await callThirdPartyApi('/ping', { method: 'GET' });
    expect(result).toEqual({ ok: true });
  });

  it('retries on a 500 then succeeds', async () => {
    const pool = mockAgent.get('https://api.fake-upstream.test');
    pool.intercept({ path: '/flaky', method: 'GET' }).reply(500);
    pool.intercept({ path: '/flaky', method: 'GET' }).reply(200, { ok: true });

    const result = await callThirdPartyApi('/flaky', { method: 'GET' });
    expect(result).toEqual({ ok: true });
  });
});

afterAll(async () => {
  const redisClient = require('../src/config/redis');
  await redisClient.quit();
});
