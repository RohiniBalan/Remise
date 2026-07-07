require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));

app.use('/api/payment', paymentRoutes);

app.get('/health', (req, res) => res.json({ success: true, service: 'payment-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`✅ Payment Service running on port ${PORT}`));
