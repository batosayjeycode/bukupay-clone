const Xendit = require('xendit-node');
const logger = require('../utils/logger');

let xenditClient;

function getXenditClient() {
  if (xenditClient) return xenditClient;

  if (!process.env.XENDIT_API_KEY) {
    logger.warn('⚠️  Xendit API key not configured');
    return null;
  }

  xenditClient = new Xendit({ secretKey: process.env.XENDIT_API_KEY });
  logger.info('✅ Xendit client initialized');
  return xenditClient;
}

module.exports = { getXenditClient };
