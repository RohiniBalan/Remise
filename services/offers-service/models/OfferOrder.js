const mongoose = require('mongoose');

const offerOrderSchema = new mongoose.Schema({
  offerId:   { type: String, required: true, index: true },
  storeId:   { type: String, required: true, index: true },
  storeName: { type: String },

  // Customer info
  userId:          { type: String, default: null },
  customerName:    { type: String, required: true },
  customerPhone:   { type: String, required: true },
  customerEmail:   { type: String, default: '' },
  deliveryAddress: { type: String, required: true },

  // Offer snapshot
  offerTitle: { type: String, required: true },
  offerImage: { type: String },
  unitPrice:  { type: Number, required: true },
  quantity:   { type: Number, default: 1, min: 1 },
  totalAmount:{ type: Number, required: true },

  // Status lifecycle
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },

  notes:     { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OfferOrder', offerOrderSchema);
