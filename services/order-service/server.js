require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const orderRoutes = require('./routes/orderRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));

// Serve uploaded payment-proof screenshots
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);

app.get('/health', (req, res) => res.json({ success: true, service: 'order-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 3004;
    app.listen(PORT, () => console.log(`✅ Order Service running on port ${PORT}`));
  })
  .catch(err => { console.error('Order Service — MongoDB error:', err); process.exit(1); });
