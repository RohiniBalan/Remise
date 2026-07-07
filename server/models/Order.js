const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
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
    country: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    // LINK TO THE USER ACCOUNT
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 
    contactEmail: { type: String, required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
    orderStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
    createdAt: { type: Date, default: Date.now }
});

// Check if the model exists before compiling it
module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);