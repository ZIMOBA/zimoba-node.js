// Verifies that an incoming webhook actually came from the third
// party and wasn't forged, using an HMAC signature comparison that
// is resistant to timing attacks.
const crypto = require('crypto');

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signatureHeader, 'utf8');

  // Buffers must be equal length for timingSafeEqual, otherwise it throws.
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

module.exports = { verifySignature };
