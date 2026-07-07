const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  address: String,
  apartment: String,
  city: String,
  state: String,
  pinCode: String,
  phone: String,
  country: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: false },
  contactEmail: { type: String, required: true },
  storeId: { type: String, default: null },
  storeName: { type: String, default: null },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  orderStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
  // Delivery method chosen at checkout (Self Pickup vs Home Delivery) and its
  // own fulfillment status — kept separate from orderStatus, which tracks the
  // wider order lifecycle used by the admin panel.
  deliveryMethod: { type: String, enum: ['pickup', 'delivery'] },
  deliveryStatus: { type: String, enum: ['Pending', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' },
  // Set when paymentMethod is 'qr' and the customer uploads proof of payment
  paymentProofImage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

orderSchema.index({ userId: 1 });
orderSchema.index({ storeId: 1 });
orderSchema.index({ contactEmail: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
