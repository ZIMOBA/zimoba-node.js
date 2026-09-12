// Pure Express app setup: middleware + routes. No listening here,
// no socket/server wiring here. That separation is what makes this
// file importable directly into tests (see tests/user.test.js)
// without spinning up a real network port.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// --- Global middleware ---
app.use(helmet());
app.use(cors());
app.use(requestLogger);

// Webhook routes are mounted BEFORE express.json() because they
// need to parse their own body with a raw-body capture step for
// signature verification. See routes/webhookRoutes.js.
app.use('/webhooks', webhookRoutes);

app.use(express.json());
app.use(apiLimiter);

// --- Routes ---
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 for anything unmatched
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Must be last: catches errors passed via next(err) from any route.
app.use(errorHandler);

module.exports = app;
