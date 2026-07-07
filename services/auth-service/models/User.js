const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: function () { return !this.googleId; } },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobilenumber: { type: String, sparse: true, default: null },
  password: { type: String, required: function () { return !this.googleId; } },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'store_owner', 'moderator', 'admin'], default: 'user' },
  cart: { type: [cartItemSchema], default: [], select: false },
  isEmailVerified:          { type: Boolean, default: false },
  emailVerificationToken:   { type: String,  default: null, select: false },
  emailVerificationExpires: { type: Date,    default: null, select: false },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
