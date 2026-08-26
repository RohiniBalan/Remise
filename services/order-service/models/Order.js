const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  storeId:   { type: String, default: null },
  storeName: { type: String, default: null },
  title: { type: String, required: true },
  brand: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
  moq:       { type: Number },   
  tierLabel: { type: String },
}, { _id: false });

const vendorTransferSchema = new mongoose.Schema({
  storeId: { type: String, required: true },
  storeName: { type: String, default: '' },
  vendorId: { type: String, default: null }, // Cashfree Vendor ID
  cashfreeSplitId: { type: String, default: null }, // Cashfree Split ID / Reference
  razorpayAccountId: { type: String, default: null }, // Preserved for historical records
  razorpayTransferId: { type: String, default: null }, // Preserved for historical records
  grossAmount: { type: Number, required: true }, // Total items amount for this vendor in INR
  commissionAmount: { type: Number, required: true }, // Platform fee in INR
  vendorAmount: { type: Number, required: true }, // Net vendor amount in INR
  transferStatus: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed', 'reversed'],
    default: 'pending'
  },
  failureReason: { type: String, default: null },
  processedAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now }
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
  paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  orderStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
  stockStatus: { type: String, enum: ['NONE', 'RESERVED', 'COMMITTED', 'RELEASED', 'RESTORED'], default: 'NONE' },
  stockExpiresAt: { type: Date, default: null },

  // Cashfree Easy Split & PG Fields
  cashfreeOrderId: { type: String, default: null, index: true },
  cashfreePaymentId: { type: String, default: null, index: true },
  paymentSessionId: { type: String, default: null },

  // Razorpay Route Marketplace Fields (Preserved for historical records)
  razorpayOrderId: { type: String, default: null, index: true },
  razorpayPaymentId: { type: String, default: null, index: true },
  razorpaySignature: { type: String, default: null },
  vendorTransfers: [vendorTransferSchema],

  // Delivery method chosen at checkout (Self Pickup vs Home Delivery) and its
  // own fulfillment status — kept separate from orderStatus, which tracks the
  // wider order lifecycle used by the admin panel.
  deliveryMethod: { type: String, enum: ['pickup', 'delivery'], default: 'delivery' },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Assigned', 'Accepted', 'Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  deliveryMode: {
    type: String,
    enum: ['own_delivery', 'portal_delivery', 'self_arrange', null],
    default: null
  },
  deliveryToken: { type: String, default: null, index: true },
  deliveryPerson: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    assignedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    notes: { type: String, default: '' }
  },
  deliveryTimeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'Delivery Person' },
    note: { type: String, default: '' }
  }],
  // Set when paymentMethod is 'qr' and the customer uploads proof of payment
  paymentProofImage: { type: String, default: null },
  moq:       { type: Number },
  tierLabel: { type: String },
  buyerId:   { type: mongoose.Schema.Types.ObjectId, default: null }, // the store owner placing the order
  buyerRole: { type: String, enum: ['user', 'store_owner'], default: 'user' },
  supplierRole: { type: String, enum: ['store_owner', 'whole_saler', 'home_business'], default: 'store_owner' },
  createdAt: { type: Date, default: Date.now },
});


orderSchema.index({ userId: 1 });
orderSchema.index({ storeId: 1 });
orderSchema.index({ contactEmail: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ cashfreeOrderId: 1 });
orderSchema.index({ cashfreePaymentId: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ razorpayPaymentId: 1 });
orderSchema.index({ 'vendorTransfers.cashfreeSplitId': 1 });
orderSchema.index({ 'vendorTransfers.razorpayTransferId': 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);

