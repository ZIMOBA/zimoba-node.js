const { verifySignature } = require('../utils/webhookVerify');
const { webhookSecret } = require('../config/env');
const { asyncHandler } = require('../middleware/errorHandler');
const { getIO } = require('../sockets');

// req.rawBody is populated by the raw-body middleware wired up in
// app.js specifically for this route, since signature verification
// needs the exact bytes the sender signed, not the re-serialized JSON.
const handleIncomingWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const valid = verifySignature(req.rawBody, signature, webhookSecret);

  if (!valid) {
    req.log.warn('rejected webhook with invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  req.log.info({ eventType: event.type }, 'webhook received');

  // Example: push a real-time update to the affected user over
  // WebSocket the moment the webhook confirms something changed.
  if (event.type === 'payment.succeeded' && event.userId) {
    getIO().to(`user:${event.userId}`).emit('payment:updated', event.data);
  }

  // Always acknowledge quickly; do any heavy lifting in a queued job.
  res.sendStatus(200);
});

module.exports = { handleIncomingWebhook };
