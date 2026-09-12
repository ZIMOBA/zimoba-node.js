// Real-time layer. initSocket() is called once from server.js with
// the raw HTTP server. getIO() lets any controller or service (e.g.
// webhookController) push events without passing the io instance
// around everywhere.
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const { jwtSecret, clientUrl } = require('../config/env');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: clientUrl },
  });

  // Redis adapter: required the moment you run more than one server
  // instance, since sockets don't share state across processes.
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Auth the socket handshake with the same JWT used by the REST API.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    logger.info({ userId: socket.userId }, 'socket connected');
    socket.join(`user:${socket.userId}`); // room-per-user for targeted pushes

    socket.on('disconnect', () => {
      logger.info({ userId: socket.userId }, 'socket disconnected');
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized yet, call initSocket() first');
  return io;
}

module.exports = { initSocket, getIO };
