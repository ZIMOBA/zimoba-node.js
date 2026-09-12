// Attaches a correlation ID and a child logger to every request so
// you can trace one request across multiple log lines and services.
const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  req.correlationId = req.headers['x-correlation-id'] || randomUUID();
  req.log = logger.child({ correlationId: req.correlationId });

  res.setHeader('X-Correlation-Id', req.correlationId);

  const startedAt = Date.now();
  req.log.info({ method: req.method, path: req.path }, 'request received');

  res.on('finish', () => {
    req.log.info(
      { statusCode: res.statusCode, durationMs: Date.now() - startedAt },
      'request completed'
    );
  });

  next();
}

module.exports = requestLogger;
