/**
 * Analytics Controller
 * Handles analytics and reporting requests
 */

const { 
  getHourlySales, 
  getSalesByCategory 
} = require('../services/analyticsService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/analytics/hourly-sales
 * Get hourly (or interval-based) sales data for charts
 * Updated: Now fetches ALL sales if no start/end date is provided
 */
const getHourlySalesData = asyncHandler(async (req, res) => {
  const { start_date, end_date, interval } = req.query;

  const options = {
    // If no start_date provided, fetch from beginning (null means no restriction)
    start_date: start_date || null,
    end_date: end_date || null, // null = fetch till latest
    interval: interval || 'hour',
    all_time: !start_date && !end_date // flag for service layer
  };

  const result = await getHourlySales(options);

  res.status(200).json({
    success: true,
    message: options.all_time 
      ? 'Fetched all-time sales data successfully' 
      : 'Fetched filtered sales data successfully',
    data: result
  });
});

/**
 * GET /api/analytics/category-sales
 * Get sales breakdown by category
 */
const getCategorySales = asyncHandler(async (req, res) => {
  const { start_date, end_date, limit } = req.query;
  
  const options = {
    start_date: start_date || null,
    end_date: end_date || null,
    limit: limit ? parseInt(limit) : 10
  };
  
  const result = await getSalesByCategory(options);
  
  res.status(200).json({
    success: true,
    message: 'Fetched category-wise sales successfully',
    data: result
  });
});

module.exports = {
  getHourlySalesData,
  getCategorySales
};
