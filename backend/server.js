require('dotenv').config();

// ── #23 Environment validation ───────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  // Use plain console here — logger may not yet be initialised
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./utils/logger');

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});

// ── #22 Graceful shutdown ────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received — closing server');
  server.close(async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (err) {
      logger.error({ err }, 'Error closing MongoDB connection');
    }
    process.exit(0);
  });

  // Force-exit if still open after 10 s
  setTimeout(() => {
    logger.error('Forced exit after 10 s shutdown timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
