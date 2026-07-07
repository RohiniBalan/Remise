require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const morgan    = require('morgan');
const path      = require('path');

const storeRoutes = require('./routes/storeRoutes');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded logos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/stores', storeRoutes);

// Health check
app.get('/health', (req, res) => res.json({ service: 'store-service', status: 'ok' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('[Store Service]', err.message);
  res.status(500).json({ success: false, message: err.message });
});

const MONGO_URI = process.env.MONGODB_URI;
const PORT      = process.env.PORT || 3007;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[Store Service] MongoDB connected');
    app.listen(PORT, () => console.log(`🏪 Store Service running on port ${PORT}`));
  })
  .catch(err => {
    console.error('[Store Service] MongoDB error:', err.message);
    process.exit(1);
  });
