const mongoose = require("mongoose");

const reservationItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const stockReservationSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [reservationItemSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "COMMITTED", "RELEASED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    committedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
    releaseReason: { type: String, default: null },
  },
  { timestamps: true }
);

stockReservationSchema.index({ status: 1, expiresAt: 1 });

module.exports =
  mongoose.models.StockReservation ||
  mongoose.model("StockReservation", stockReservationSchema);
