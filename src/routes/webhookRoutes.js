const express = require('express');
const { handleIncomingWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Signature verification needs the exact raw bytes the sender
// signed, so this route captures req.rawBody before express.json()
// would otherwise consume and re-serialize the stream. See app.js
// for how this verify function is wired into the JSON parser.
function captureRawBody(req, res, buf) {
  req.rawBody = buf;
}

router.post(
  '/incoming',
  express.json({ verify: captureRawBody }),
  handleIncomingWebhook
);

module.exports = router;
