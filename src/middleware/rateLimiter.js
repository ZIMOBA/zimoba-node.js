// Caps requests per IP on your own API. Uses the default in-memory
// store here for simplicity; swap the `store` option for
// rate-limit-redis if you run multiple server instances and need a
// shared counter across them.
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for sensitive routes like login, where brute
// forcing is a real risk.
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

const resendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Lancez une autre essaye dans 10 minutes" }
})

module.exports = { apiLimiter, authLimiter, resendLimiter };
