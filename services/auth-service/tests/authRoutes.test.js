const test = require('node:test');
const assert = require('node:assert/strict');
const authRoutes = require('../routes/authRoutes');

test('auth routes expose forgot-password and reset-password endpoints', () => {
  const paths = authRoutes.stack
    .filter(layer => layer.route)
    .map(layer => layer.route.path);

  assert(paths.includes('/forgot-password'));
  assert(paths.includes('/reset-password'));
});
