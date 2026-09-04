const Product = require('../models/Product');

const parseBodyPayload = (body) => {
  const payload = { ...body };
  if (typeof payload.bulkPricing === 'string') {
    try { payload.bulkPricing = JSON.parse(payload.bulkPricing); } catch (e) {}
  }
  if (typeof payload.specifications === 'string') {
    try { payload.specifications = JSON.parse(payload.specifications); } catch (e) {}
  }
  if (typeof payload.attributes === 'string') {
    try { payload.attributes = JSON.parse(payload.attributes); } catch (e) {}
  }
  if (typeof payload.images === 'string') {
    try { payload.images = JSON.parse(payload.images); } catch (e) {}
  }
  if (typeof payload.tags === 'string') {
    try { payload.tags = JSON.parse(payload.tags); } catch (e) {
      payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }
  return payload;
};

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const payload = parseBodyPayload(req.body);
    const product = await Product.create(payload);

    res.status(201).json({
      success: true,
      message: 'Product saved successfully to Database!',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle Mongoose Validation Errors gracefully
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Public 
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/admin/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const payload = parseBodyPayload(req.body);
    product = await Product.findByIdAndUpdate(
       req.params.id,
       payload,
       { new: true, runValidators: true }
     );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};