const Bottleneck = require('bottleneck');
const pRetry = require('p-retry');
const CircuitBreaker = require('opossum');
const { fetch } = require('undici');
const logger = require('../utils/logger');

function createThirdPartyClient({
  name,               // label for logs, e.g. 'whatsapp', 'exchangeRate'
  baseUrl,
  apiKey,
  minTime = 200,       // ms between requests (throttle)
  maxConcurrent = 5,
  retries = 3,
  timeout = 8000,      // ms before circuit breaker treats a call as failed
  errorThresholdPercentage = 50,
  resetTimeout = 30000,
  authHeader = (key) => ({ Authorization: `Bearer ${key}` }),
}) {
  const limiter = new Bottleneck({ minTime, maxConcurrent });

  async function rawFetch(path, options = {}) {
    return pRetry(
      async () => {
        const res = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers: {
            ...authHeader(apiKey),
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (res.status >= 500) {
          throw new Error(`${name}: upstream returned ${res.status}`);
        }
        if (!res.ok) {
          const err = new Error(`${name}: API error ${res.status}`);
          err.statusCode = res.status;
          throw new pRetry.AbortError(err); // don't retry 4xx
        }
        return res.json();
      },
      {
        retries,
        onFailedAttempt: (error) => {
          logger.warn(
            { client: name, attempt: error.attemptNumber, retriesLeft: error.retriesLeft },
            `${name} call failed, retrying`
          );
        },
      }
    );
  }

  const breaker = new CircuitBreaker(
    (path, options) => limiter.schedule(() => rawFetch(path, options)),
    { timeout, errorThresholdPercentage, resetTimeout }
  );

  breaker.fallback(() => {
    throw Object.assign(new Error(`${name} temporarily unavailable`), { statusCode: 503 });
  });

  breaker.on('open', () => logger.error(`Circuit breaker OPEN: ${name} failing repeatedly`));
  breaker.on('halfOpen', () => logger.info(`Circuit breaker HALF-OPEN: testing ${name}`));
  breaker.on('close', () => logger.info(`Circuit breaker CLOSED: ${name} recovered`));

  return {
    call: (path, options = {}) => breaker.fire(path, options),
  };
}

module.exports = { createThirdPartyClient };
