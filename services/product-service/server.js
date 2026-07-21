require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const productRoutes      = require('./routes/productRoutes');
const categoryRoutes     = require('./routes/categoryRoutes');
const productImageRoutes = require('./routes/productImageRoutes');

const app = express();
app.set('trust proxy', 1);

// Ensure uploads dir for product images
const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DEBUG ROUTE (NEWLY ADDED)
app.get("/debug/files", (req, res) => {
  const dir = path.join(__dirname, "uploads", "products");

  res.json({
    exists: fs.existsSync(dir),
    files: fs.existsSync(dir) ? fs.readdirSync(dir) : [],
  });
});

app.use('/api/admin/products', productRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/product-images', productImageRoutes);

app.get('/health', (req, res) => res.json({ success: true, service: 'product-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => console.log(`✅ Product Service running on port ${PORT}`));
  })
  .catch(err => { console.error('Product Service — MongoDB error:', err); process.exit(1); });
