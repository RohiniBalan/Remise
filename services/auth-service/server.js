require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const morgan = require('morgan');

require('./config/passport')(passport);

const authRoutes = require('./routes/authRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    process.env.GATEWAY_URL || 'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://wow-frontedn-y73e.vercel.app',
  ],
  credentials: true,
}));
app.use(morgan('dev'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'auth_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => res.json({ success: true, service: 'auth-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`✅ Auth Service running on port ${PORT}`));
  })
  .catch(err => { console.error('Auth Service — MongoDB error:', err); process.exit(1); });
