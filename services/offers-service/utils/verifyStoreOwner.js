const axios = require('axios');

const STORE_SERVICE = process.env.STORE_SERVICE_URL || 'http://localhost:3007';

// Resolves storeId -> ownerId via store-service's internal lookup and checks
// it matches the authenticated user. Admins bypass the check entirely.
// Returns true/false; never throws (a lookup failure is treated as "not owned").
const isStoreOwnedBy = async (storeId, userId, role) => {
  if (role === 'admin') return true;
  if (!storeId || !userId) return false;
  try {
    const res = await axios.get(`${STORE_SERVICE}/api/stores/internal/${storeId}`);
    return res.data?.data?.ownerId === userId;
  } catch (err) {
    console.error('[verifyStoreOwner] lookup failed:', err.message);
    return false;
  }
};

module.exports = { isStoreOwnedBy };
