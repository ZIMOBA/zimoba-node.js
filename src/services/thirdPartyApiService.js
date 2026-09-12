// This is the pattern to copy whenever you add a NEW third-party
// integration: throttle outgoing calls so you never exceed their
// rate limit, retry transient failures with backoff, and wrap the
// whole thing in a circuit breaker so a dead upstream doesn't take
// your app down with it.
const Bottleneck = require('bottleneck');
const pRetry = require('p-retry');
const CircuitBreaker = require('opossum');
const { thirdPartyApiBaseUrl, thirdPartyApiKey } = require('../config/env');
const logger = require('../utils/logger');

// 1. Throttle: never send more than 5 requests/sec to this API.
const limiter = new Bottleneck({
  minTime: 200,
  maxConcurrent: 5,
});

// 2. Raw call with retry on transient failures (network blips, 5xx).
async function rawFetch(path, options = {}) {
  return pRetry(
    async () => {
      const res = await fetch(`${thirdPartyApiBaseUrl}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${thirdPartyApiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (res.status >= 500) {
        // Only retry server errors, not 4xx client errors.
        throw new Error(`Upstream returned ${res.status}`);
      }
      if (!res.ok) {
        const err = new Error(`Third-party API error: ${res.status}`);
        err.statusCode = res.status;
        throw new pRetry.AbortError(err); // don't retry 4xx
      }
      return res.json();
    },
    {
      retries: 3,
      onFailedAttempt: (error) => {
        logger.warn(
          { attempt: error.attemptNumber, retriesLeft: error.retriesLeft },
          'third-party API call failed, retrying'
        );
      },
    }
  );
}

// 3. Circuit breaker on top of the throttled + retried call.
const breaker = new CircuitBreaker(
  (path, options) => limiter.schedule(() => rawFetch(path, options)),
  {
    timeout: 8000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  }
);

breaker.fallback(() => {
  throw Object.assign(new Error('Third-party API temporarily unavailable'), {
    statusCode: 503,
  });
});

breaker.on('open', () => logger.error('Circuit breaker OPEN: third-party API failing repeatedly'));
breaker.on('halfOpen', () => logger.info('Circuit breaker HALF-OPEN: testing third-party API'));
breaker.on('close', () => logger.info('Circuit breaker CLOSED: third-party API recovered'));

async function callThirdPartyApi(path, options = {}) {
  return breaker.fire(path, options);
}

module.exports = { callThirdPartyApi };
