// ============================================================
// ISIP — HTTP Server + Socket.IO
// ============================================================

import http from 'http';
import app from './app.js';
import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeSocket } from './socket/socket.manager.js';
import { startSensorSimulation, stopSensorSimulation } from './utils/simulator.js';
import logger from './utils/logger.js';

const server = http.createServer(app);

/**
 * Start the server.
 */
async function start() {
  try {
    // 1. Connect to PostgreSQL
    await connectDatabase();

    // 2. Initialize Socket.IO
    initializeSocket(server);

    // 3. Start live IoT sensor simulator
    startSensorSimulation();

    // 4. Start HTTP server
    server.listen(env.port, () => {
      logger.info('════════════════════════════════════════════════');
      logger.info('  ISIP Backend — Industrial Safety Intelligence');
      logger.info('════════════════════════════════════════════════');
      logger.info(`  Environment : ${env.nodeEnv}`);
      logger.info(`  Port        : ${env.port}`);
      logger.info(`  API         : http://localhost:${env.port}/api`);
      logger.info(`  Swagger     : http://localhost:${env.port}/api-docs`);
      logger.info(`  Health      : http://localhost:${env.port}/health`);
      logger.info(`  Socket.IO   : ws://localhost:${env.port}`);
      logger.info('════════════════════════════════════════════════');
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ── Graceful Shutdown ────────────────────────────────────

function gracefulShutdown(signal) {
  logger.info(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');
    stopSensorSimulation();
    await disconnectDatabase();
    logger.info('All connections closed. Exiting.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// ── Start ────────────────────────────────────────────────
start();
