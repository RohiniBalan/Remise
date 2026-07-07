require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const morgan   = require('morgan');
const path     = require('path');

const offerRoutes = require('./routes/offerRoutes');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded offer images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/offers', offerRoutes);

// Health check
app.get('/health', (req, res) => res.json({ service: 'offers-service', status: 'ok' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('[Offers Service]', err.message);
  res.status(500).json({ success: false, message: err.message });
});

const MONGO_URI = process.env.MONGODB_URI;
const PORT      = process.env.PORT || 3008;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[Offers Service] MongoDB connected');
    app.listen(PORT, () => console.log(`🏷️  Offers Service running on port ${PORT}`));
  })
  .catch(err => {
    console.error('[Offers Service] MongoDB error:', err.message);
    process.exit(1);
  });
