const jwt = require("jsonwebtoken");
const { jwtSecret, refreshSecret } = require("../config/env");

const issueTokens = (user) => {
  const accessToken = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(
    { userId: user._id, version: user.refreshTokenVersion },
    refreshSecret,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const createToken = (payload, options = {}) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: '10m', ...options });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (err) {
    return null;
  }
};

module.exports = { issueTokens, createToken, verifyToken };
