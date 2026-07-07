require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const morgan   = require('morgan');

const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => res.json({ service: 'notification-service', status: 'ok' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('[Notification Service]', err.message);
  res.status(500).json({ success: false, message: err.message });
});

const MONGO_URI = process.env.MONGODB_URI;
const PORT      = process.env.PORT || 3009;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[Notification Service] MongoDB connected');
    app.listen(PORT, () => console.log(`🔔 Notification Service running on port ${PORT}`));
  })
  .catch(err => {
    console.error('[Notification Service] MongoDB error:', err.message);
    process.exit(1);
  });
