// utils/tokenCleanup.js
const Token = require('../models/Token');

// Run this periodically to clean up expired/inactive tokens
const cleanupTokens = async () => {
  try {
    // Delete tokens older than 7 days (they will auto-expire due to TTL index)
    // But we can also manually clean up if needed
    const result = await Token.deleteMany({
      isActive: false,
      createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days
    });
    
    console.log(`Cleaned up ${result.deletedCount} inactive tokens`);
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
  }
};

// You can run this cleanup job periodically
// For example, using node-cron or setInterval
// cleanupTokens();

module.exports = cleanupTokens;