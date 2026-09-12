const mongoose = require('mongoose');
const { mongoUri } = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed');
    process.exit(1); // don't run a server that can't reach its database
  }
}

module.exports = connectDB;
