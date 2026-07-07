const jwt = require('jsonwebtoken');

/**
 * Decodes JWT (if present) and forwards user identity as internal headers.
 * Downstream services MUST NOT trust x-user-* headers from external callers.
 * The gateway strips any incoming x-user-* headers before forwarding.
 */
const authForward = (req, res, next) => {
  // Strip any externally-supplied internal headers to prevent spoofing
  delete req.headers['x-user-id'];
  delete req.headers['x-user-role'];
  delete req.headers['x-user-email'];

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.headers['x-user-id'] = decoded.id;
      req.headers['x-user-role'] = decoded.role || 'user';
      if (decoded.email) req.headers['x-user-email'] = decoded.email;
    } catch {
      // Invalid/expired token — downstream protect middleware will reject if auth required
    }
  }
  next();
};

module.exports = authForward;
