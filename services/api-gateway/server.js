require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authForward = require('./middleware/authForward');

const axios = require('axios');

const app = express();

app.set('trust proxy', 1);

// ─── Service URLs ────────────────────────────────────────────────────────────
const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:3001',
  user:         process.env.USER_SERVICE_URL         || 'http://localhost:3002',
  product:      process.env.PRODUCT_SERVICE_URL      || 'http://localhost:3003',
  order:        process.env.ORDER_SERVICE_URL        || 'http://localhost:3004',
  payment:      process.env.PAYMENT_SERVICE_URL      || 'http://localhost:3005',
  content:      process.env.CONTENT_SERVICE_URL      || 'http://localhost:3006',
  store:        process.env.STORE_SERVICE_URL        || 'http://localhost:3007',
  offers:       process.env.OFFERS_SERVICE_URL       || 'http://localhost:3008',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
};

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:4000',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://wow-frontedn-y73e.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'Authorization'],
}));

app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use(authForward);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, gateway: 'running', services: SERVICES, timestamp: new Date().toISOString() });
});

// ─── Wake-Up Check ────────────────────────────────────────────────────────────
app.get("/wake-up", async (req, res) => {
  const services = [
    { name: "Auth", url: `${SERVICES.auth}/health` },
    { name: "User", url: `${SERVICES.user}/health` },
    { name: "Product", url: `${SERVICES.product}/health` },
    { name: "Order", url: `${SERVICES.order}/health` },
    { name: "Payment", url: `${SERVICES.payment}/health` },
    { name: "Content", url: `${SERVICES.content}/health` },
    { name: "Store", url: `${SERVICES.store}/health` },
    { name: "Offers", url: `${SERVICES.offers}/health` },
    { name: "Notification", url: `${SERVICES.notification}/health` },
  ];

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const MAX_RETRIES = 15;

  let results = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {

    results = [];

    let allAwake = true;

    await Promise.all(
      services.map(async (service) => {
        try {
          const response = await axios.get(service.url, {
            timeout: 5000,
          });

          results.push({
            service: service.name,
            status: "awake",
            code: response.status,
          });

        } catch (err) {

          allAwake = false;

          results.push({
            service: service.name,
            status: "sleeping",
            code: err.response?.status || 500,
          });

        }
      })
    );

    console.log(
      `Wake-up attempt ${attempt}/${MAX_RETRIES} : ${
        results.filter((r) => r.status === "awake").length
      }/${services.length} services awake`
    );

    if (allAwake) {
      return res.json({
        success: true,
        message: "All services are awake.",
        services: results,
      });
    }

    await delay(3000);
  }

  const allAwake = results.every(
    service => service.status === "awake"
);

res.json({
    success: allAwake,
    services: results
});
});

// ─── Proxy Factory ───────────────────────────────────────────────────────────
// When Express mounts middleware at /api/foo, it strips that prefix from
// req.url before passing control (req.url becomes '/' or '/bar').
// pathRewrite restores the full path by prepending the mount prefix back,
// so downstream services always receive the complete path they expect.
//
// Example: GET /api/stores/me/my-store
//   → Express strips /api/stores  → req.url = '/me/my-store'
//   → pathRewrite '^/'            → req.url = '/api/stores/me/my-store'
//   → forwarded to :3007 as-is    ✓
//
const makeProxy = (target, mountPath) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite: (path) => mountPath + (path === '/' ? '' : path),
  on: {
    proxyRes: (proxyRes) => {
      // Strip downstream CORS headers so the gateway's own cors() middleware wins
      delete proxyRes.headers['access-control-allow-origin'];
      delete proxyRes.headers['access-control-allow-credentials'];
      delete proxyRes.headers['access-control-allow-methods'];
      delete proxyRes.headers['access-control-allow-headers'];
      delete proxyRes.headers['access-control-expose-headers'];
    },
    error: (err, req, res) => {
      console.error(`[Gateway] Proxy error → ${target}: ${err.message}`);
      if (!res.headersSent) {
        res.status(503).json({ success: false, message: `Service temporarily unavailable (${target})` });
      }
    },
  },
});

// ─── Route Table ─────────────────────────────────────────────────────────────

app.use('/api/auth/internal',
  (req, res) => res.status(403).json({ success: false, message: 'Forbidden.' })
);

app.use('/api/auth',
  authLimiter,
  makeProxy(SERVICES.auth, '/api/auth')
);

app.use('/api/user',
  makeProxy(SERVICES.user, '/api/user')
);

app.use('/api/admin/users',
  makeProxy(SERVICES.user, '/api/admin/users')
);

app.use('/api/admin/products',
  makeProxy(SERVICES.product, '/api/admin/products')
);
app.use('/api/admin/categories',
  makeProxy(SERVICES.product, '/api/admin/categories')
);
app.use('/api/products',
  makeProxy(SERVICES.product, '/api/products')
);
app.use('/api/categories',
  makeProxy(SERVICES.product, '/api/categories')
);
app.use('/api/product-images',
  makeProxy(SERVICES.product, '/api/product-images')
);

app.use('/api/orders',
  makeProxy(SERVICES.order, '/api/orders')
);
app.use('/api/admin/orders',
  makeProxy(SERVICES.order, '/api/admin/orders')
);

app.use('/api/payment',
  makeProxy(SERVICES.payment, '/api/payment')
);

const contentRoutes = [
  '/api/hero', '/api/trending', '/api/studio', '/api/ralleyz',
  '/api/characters', '/api/bestsellers', '/api/shopbyage',
  '/api/shopbycategory', '/api/bentogrid', '/api/reviews',
  '/api/services', '/api/contact', '/api/blog-lifestyle',
  '/api/enhanced-testimonials',
];
contentRoutes.forEach(route => {
  app.use(route, makeProxy(SERVICES.content, route));
});

// Static uploads — service-specific prefixes must be registered before the
// generic '/uploads' catch-all below, since Express matches in order.
app.use('/uploads/stores',
  makeProxy(SERVICES.store, '/uploads/stores')
);
app.use('/uploads/payment-proofs',
  makeProxy(SERVICES.order, '/uploads/payment-proofs')
);
// Static product images served by product-service
app.use('/uploads',
  makeProxy(SERVICES.product, '/uploads')
);

app.use('/api/stores',
  (req, res, next) => {
    if (req.path.startsWith('/internal/')) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    next();
  },
  makeProxy(SERVICES.store, '/api/stores')
);

app.use('/api/offers',
  makeProxy(SERVICES.offers, '/api/offers')
);

app.use('/api/notifications',
  (req, res, next) => {
    if (req.path.startsWith('/internal/')) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    next();
  },
  makeProxy(SERVICES.notification, '/api/notifications')
);

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway running on port ${PORT}`);
  Object.entries(SERVICES).forEach(([name, url]) =>
    console.log(`  /api/${name.padEnd(12)} → ${url}`)
  );
});
