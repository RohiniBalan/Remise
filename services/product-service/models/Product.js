const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    description: { type: String, trim: true },
    price: { type: Number, required: [true, "Price is required"], min: 0 },
    discountedPrice: { type: Number, min: 0 },
    images: [{ type: String, trim: true }],
    imageUrl: { type: String, trim: true },
    category: { type: String, trim: true },
    ageGroup: { type: String, trim: true },
    brand: { type: String, trim: true },
    availability: {
      type: String,
      enum: ["In Stock", "Out Of Stock", "Pre Order"],
      default: "In Stock",
    },
    totalStock: { type: Number, default: 0, min: 0 },
    tags: [{ type: String, trim: true }],
    featured: { type: Boolean, default: false },
    // Store-owner fields — null = admin-level product visible to all stores
    storeId: { type: String, default: null, index: true },
    ownerId: { type: String, default: null, index: true },
    // Bulk/wholesale fields — only used when ownerRole is whole_saler / home_business
    ownerRole: {
      type: String,
      enum: ["store_owner", "whole_saler", "home_business"],
      default: "store_owner",
    },
    moq: { type: Number, default: 1, min: 1 }, // minimum order quantity for bulk buyers
    bulkPricing: [
      {
        minQty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    lowStockThreshold: { type: Number, default: 5 },
    lowStockNotifiedAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

productSchema.index({ category: 1 });
productSchema.index({ availability: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
