const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const storeSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true,
    index: true
  },
  ownerName: { type: String, required: true },

  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  logo: { type: String, default: null },
  upiId: { type: String, default: null },
  qrCodeImage: { type: String, default: null },
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  category: {
    type: String,
    trim: true,
    default: 'Other'
  },

  // FSSAI license number — only meaningful when category is 'Food & Beverages',
  // but stored unconditionally (nulled out if category changes away from it).
  fssai: { type: String, default: null },

  // Tax and Business Identification
  pan: {
    type: String,
    trim: true,
    uppercase: true,
    default: null,
    index: true,
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
    default: null,
  },

  storeType: {
    type: String,
    enum: ['store', 'whole_saler', 'home_business'],
    default: 'store',
    index: true,
  },

  address: {
    street:  { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pinCode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },

  isActive:   { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  totalOffers:    { type: Number, default: 0 },
  totalOrders:    { type: Number, default: 0 },

  targetRevenue: { type: Number, default: 0 },

  // Delivery Portal Network Enrollment
  deliveryPortalEnabled: { type: Boolean, default: false },
  deliveryPortalJoinedAt: { type: Date, default: null },
  hasOwnDelivery: { type: Boolean, default: null },

  // Cashfree Easy Split Vendor
  cashfreeVendorId: { type: String, default: null, index: true },
  cashfreeVendorStatus: {
    type: String,
    enum: ['not_created', 'in_creation', 'active', 'suspended', 'rejected'],
    default: 'not_created',
    index: true,
  },
  cashfreeKycStatus: { type: String, default: null },

  // Razorpay Route Linked Account (Preserved for historical reference)
  razorpayAccountId: { type: String, default: null, index: true },
  razorpayStakeholderId: { type: String, default: null },
  razorpayRouteStatus: {
    type: String,
    enum: ['not_created', 'created', 'under_review', 'active', 'suspended', 'rejected'],
    default: 'not_created',
    index: true,
  },
  razorpayRouteProductStatus: { type: String, default: null },
  commissionPercentage: { type: Number, default: 10, min: 0, max: 100 },
  businessDetails: {
    legalBusinessName: { type: String, default: null },
    businessType: { type: String, default: 'individual' },
    pan: { type: String, default: null },
    gstin: { type: String, default: null },
    fssaiNumber: { type: String, default: null },
    bankAccount: {
      accountNumber: { type: String, default: null },
      ifscCode: { type: String, default: null },
      beneficiaryName: { type: String, default: null },
    },
  },

  createdAt: { type: Date, default: Date.now }
});


storeSchema.index({ location: '2dsphere' });
storeSchema.index({ ownerId: 1 });
storeSchema.index({ isActive: 1, isVerified: 1 });
storeSchema.index({ cashfreeVendorId: 1 });
storeSchema.index({ cashfreeVendorStatus: 1 });
storeSchema.index({ razorpayAccountId: 1 });
storeSchema.index({ razorpayRouteStatus: 1 });

module.exports = mongoose.model('Store', storeSchema);