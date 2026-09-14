const http = require('http');
const { port, nodeEnv } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const { initSocket } = require('./sockets');
const logger = require('./utils/logger');

async function start() {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(port, () => {
    logger.info(`Server running on port ${port} [${nodeEnv}]`);
  });

  // Fail loudly instead of leaving the process in a broken half-alive state.
  process.on('unhandledRejection', (err) => {
    logger.error({ err }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

start();
