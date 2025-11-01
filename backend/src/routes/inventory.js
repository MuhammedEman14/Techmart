/**
 * Inventory Routes
 * Routes for inventory management operations
 */

const express = require('express');
const router = express.Router();
const { 
  getLowStock, 
  getInventoryVal, 
  updateStock,
  getProductCategories,
  getProductsByCategory
} = require('../controllers/inventoryController');
const { validateLowStockQuery } = require('../middleware/validators');

/**
 * GET /api/inventory/low-stock
 * Get products below reorder threshold
 */
router.get('/low-stock', validateLowStockQuery, getLowStock);

/**
 * GET /api/inventory/value
 * Get inventory value breakdown by category
 */
router.get('/value', getInventoryVal);

/**
 * PUT /api/inventory/stock/:productId
 * Update product stock quantity
 */
router.put('/stock/:productId', updateStock);
router.get('/products/categories', getProductCategories);
router.get('/products/category/:categoryName', getProductsByCategory);
module.exports = router;