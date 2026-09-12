// Shows the pattern for testing anything that calls
// thirdPartyApiService: intercept the HTTP call with nock instead
// of hitting the real upstream in CI.
const nock = require('nock');

// Point the service at a fake base URL for this test file.
process.env.THIRD_PARTY_API_BASE_URL = 'https://api.fake-upstream.test';
process.env.THIRD_PARTY_API_KEY = 'test-key';

const { callThirdPartyApi } = require('../src/services/thirdPartyApiService');

afterEach(() => nock.cleanAll());

describe('callThirdPartyApi', () => {
  it('returns parsed JSON on success', async () => {
    nock('https://api.fake-upstream.test')
      .get('/ping')
      .reply(200, { ok: true });

    const result = await callThirdPartyApi('/ping', { method: 'GET' });
    expect(result).toEqual({ ok: true });
  });

  it('retries on a 500 then succeeds', async () => {
    nock('https://api.fake-upstream.test').get('/flaky').reply(500);
    nock('https://api.fake-upstream.test').get('/flaky').reply(200, { ok: true });

    const result = await callThirdPartyApi('/flaky', { method: 'GET' });
    expect(result).toEqual({ ok: true });
  });
});
