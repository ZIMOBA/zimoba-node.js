# Backend Robustness Starter

A clean Express + MongoDB + Redis starter that already has the
production-grade pieces wired in, so you extend it instead of
bolting them on later:

- Rate limiting (`express-rate-limit`)
- Caching (Redis cache-aside pattern)
- Background jobs (`BullMQ`)
- Retry with backoff (`p-retry`) + throttling (`Bottleneck`)
- Circuit breaker (`opossum`)
- Structured logging with correlation IDs (`pino`)
- JWT auth with refresh token rotation
- Webhook signature verification (HMAC)
- Real-time updates (`Socket.io` + Redis adapter)
- Health checks for uptime monitoring
- Tests with mocked third-party calls (`jest`, `nock`, `supertest`)
- CI on every push (`GitHub Actions`)

## Structure

```
src/
├── app.js                  # Express app: middleware + routes (no listen())
├── server.js                # Entry point: DB + HTTP server + sockets + listen()
├── config/
│   ├── env.js                # Validated env var access
│   ├── db.js                 # MongoDB connection
│   └── redis.js              # Shared Redis client
├── models/
│   └── User.js                # Mongoose schema
├── controllers/
│   ├── authController.js      # register / login / refresh
│   ├── userController.js      # profile read/update, shows cache + queue usage
│   ├── webhookController.js   # verifies + handles incoming webhooks
│   └── healthController.js    # real health check for uptime monitors
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── webhookRoutes.js
│   └── healthRoutes.js
├── middleware/
│   ├── auth.js                 # JWT guard
│   ├── rateLimiter.js          # general + auth-specific limiters
│   ├── requestLogger.js        # correlation ID + request logging
│   └── errorHandler.js         # centralized error handling + asyncHandler
├── services/
│   ├── cacheService.js         # get-or-fetch cache-aside helper
│   ├── thirdPartyApiService.js # throttle + retry + circuit breaker template
│   └── queueService.js         # BullMQ producer
├── sockets/
│   └── index.js                # Socket.io + Redis adapter + JWT auth
├── jobs/
│   └── worker.js               # BullMQ consumer, run as its own process
└── utils/
    ├── logger.js
    └── webhookVerify.js
tests/
├── health.test.js
└── thirdPartyApi.test.js
.github/workflows/ci.yml
```

## Setup

```bash
cp .env.example .env      # fill in real values
npm install
```

You'll need MongoDB and Redis running locally, or point `MONGO_URI`
and `REDIS_URL` at hosted instances (MongoDB Atlas + Upstash both
have free tiers).

## Running

```bash
npm run dev       # API server with autoreload
npm run worker    # background job worker, separate process
npm test          # run tests
```

## How to extend this as your app grows

- **New third-party integration?** Copy the pattern in
  `services/thirdPartyApiService.js` (throttle -> retry -> circuit
  breaker) rather than calling `fetch` directly from a controller.
- **New background task?** Add a producer function in
  `services/queueService.js` and a matching case in
  `jobs/worker.js`.
- **New webhook source?** Add a route in `routes/webhookRoutes.js`
  using the same raw-body + signature verification pattern.
- **New real-time event?** Emit it from wherever the state change
  happens using `getIO().to(room).emit(...)`, no need to touch
  `sockets/index.js` itself.
- **New protected route?** Add `requireAuth` as middleware, same as
  `userRoutes.js`.

## Notes

- `app.js` never calls `.listen()`. That's intentional: it lets
  `tests/*.test.js` import the app and hit it with `supertest`
  without opening a real port or needing sockets/DB fully wired.
- The webhook route parses its own JSON body (with raw-body capture
  for signature verification) and is mounted before the global
  `express.json()` in `app.js`.
- Swap `THIRD_PARTY_API_BASE_URL` / `THIRD_PARTY_API_KEY` for
  whatever real API you integrate first, and reuse
  `thirdPartyApiService.js` as the template for every one after.
