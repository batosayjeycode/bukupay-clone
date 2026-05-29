const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp;

function initFirebase() {
  if (firebaseApp) return firebaseApp;

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    logger.warn('⚠️  Firebase credentials not configured — FCM disabled');
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  logger.info('✅ Firebase Admin SDK initialized');
  return firebaseApp;
}

function getMessaging() {
  if (!firebaseApp) {
    logger.warn('Firebase not initialized, skipping FCM');
    return null;
  }
  return admin.messaging();
}

module.exports = { initFirebase, getMessaging };
