// Single place where every error ends up. Keeps controllers clean:
// they just call next(err) and this decides what the client sees.
function errorHandler(err, req, res, next) {
  const log = req.log || console;
  log.error({ err }, 'unhandled error');

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({ error: message, correlationId: req.correlationId });
}

// Wraps async route handlers so a rejected promise reaches
// errorHandler instead of crashing the process unhandled.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
