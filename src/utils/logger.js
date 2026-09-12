// Structured JSON logging. Use req.log inside routes/controllers so
// every line carries the correlation ID for that request (see
// middleware/requestLogger.js), instead of plain console.log.
const pino = require('pino');
const { logLevel, nodeEnv } = require('../config/env');

const logger = pino({
  level: logLevel,
  transport:
    nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined, // plain JSON in production, easy for log aggregators to parse
});

module.exports = logger;
