require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const userRoutes = require('./routes/userRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));

app.use('/api/user', userRoutes);
app.use('/api/admin/users', adminUserRoutes);

app.get('/health', (req, res) => res.json({ success: true, service: 'user-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => console.log(`✅ User Service running on port ${PORT}`));
  })
  .catch(err => { console.error('User Service — MongoDB error:', err); process.exit(1); });
