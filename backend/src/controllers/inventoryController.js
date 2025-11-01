/**
 * Inventory Controller
 * Handles inventory management requests
 */

const { 
  getLowStockProducts, 
  getInventoryValue,
  updateStockQuantity 
} = require('../services/inventoryService');
const { asyncHandler } = require('../middleware/errorHandler');
const { Product } = require('../models');
const { Sequelize } = require('sequelize');
/**
 * GET /api/inventory/low-stock
 * Get products below reorder threshold
 */
const getLowStock = asyncHandler(async (req, res) => {
  const { threshold, category } = req.query;
  
  const options = {
    threshold: threshold ? parseInt(threshold) : undefined,
    category: category || null
  };
  
  const result = await getLowStockProducts(options);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * GET /api/inventory/value
 * Get inventory value breakdown by category
 */
const getInventoryVal = asyncHandler(async (req, res) => {
  const result = await getInventoryValue();
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * PUT /api/inventory/stock/:productId
 * Update product stock quantity
 */
const updateStock = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, operation } = req.body;
  
  const result = await updateStockQuantity(
    parseInt(productId), 
    parseInt(quantity), 
    operation
  );
  
  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: result
  });
});
const getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.findAll({
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']
    ],
    raw: true
  });

  res.status(200).json({
    success: true,
    message: 'Fetched product categories successfully',
    data: categories.map(c => c.category).filter(Boolean)
  });
});
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryName } = req.params;

  const products = await Product.findAll({
    where: { category: categoryName },
    attributes: [
      'id',
      'name',
      'category',
      'price',
      'stock_quantity',
      'supplier_id',
      'sku',
      'description',
      'weight',
      'dimensions',
      'warranty_months',
      'created_at'
    ]
  });

  if (!products.length) {
    return res.status(404).json({
      success: false,
      message: `No products found for category: ${categoryName}`
    });
  }

  res.status(200).json({
    success: true,
    message: `Fetched products for category: ${categoryName}`,
    data: products
  });
});
module.exports = {
  getLowStock,
  getInventoryVal,
  updateStock,
  getProductCategories,
  getProductsByCategory
};