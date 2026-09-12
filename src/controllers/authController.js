const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, refreshSecret } = require('../config/env');
const { asyncHandler } = require('../middleware/errorHandler');

function issueTokens(user) {
  const accessToken = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(
    { userId: user._id, version: user.refreshTokenVersion },
    refreshSecret,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name });

  const tokens = issueTokens(user);
  req.log.info({ userId: user._id }, 'user registered');
  res.status(201).json(tokens);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const tokens = issueTokens(user);
  res.json(tokens);
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, refreshSecret);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.refreshTokenVersion !== decoded.version) {
    // version mismatch means the token was rotated out or revoked
    return res.status(401).json({ error: 'Refresh token no longer valid' });
  }

  const tokens = issueTokens(user); // rotate: a brand new refresh token is issued each time
  res.json(tokens);
});

module.exports = { register, login, refresh };
