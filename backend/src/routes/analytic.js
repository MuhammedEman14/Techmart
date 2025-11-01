/**
 * Analytics Routes
 * Routes for analytics and reporting endpoints
 */

const express = require('express');
const router = express.Router();
const { 
  getHourlySalesData, 
  getCategorySales 
} = require('../controllers/analyticController');
const { validateDateRange } = require('../middleware/validators');

/**
 * GET /api/analytics/hourly-sales
 * Get hourly sales data for charts
 */
router.get('/hourly-sales', validateDateRange, getHourlySalesData);

/**
 * GET /api/analytics/category-sales
 * Get sales breakdown by product category
 */
router.get('/category-sales', validateDateRange, getCategorySales);

module.exports = router;