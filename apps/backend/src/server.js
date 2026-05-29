require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { initFirebase } = require('./config/firebase');
const { initMqtt } = require('./config/mqtt');
const { startSettlementScheduler } = require('./jobs/settlement.worker');

const PORT = parseInt(process.env.PORT) || 3000;

async function startServer() {
  try {
    // Initialize services
    initFirebase();
    initMqtt(); // Phase 2: MQTT Soundbox

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 BukuPay API running on port ${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   Health check: http://localhost:${PORT}/health`);
    });

    // Start settlement scheduler
    startSettlementScheduler();

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          const prisma = require('./config/database');
          await prisma.$disconnect();
          logger.info('Database disconnected');

          const { redis } = require('./config/redis');
          await redis.quit();
          logger.info('Redis disconnected');
        } catch (err) {
          logger.error('Error during cleanup:', err.message);
        }

        process.exit(0);
      });

      // Force exit setelah 10 detik
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
