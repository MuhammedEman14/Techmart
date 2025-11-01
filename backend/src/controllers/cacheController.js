/**
 * Cache Management Controller
 * Admin endpoints for cache management
 */

const { asyncHandler } = require('../middleware/errorHandler');
const cacheService = require('../services/cacheService');

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = cacheService.getStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * DELETE /api/cache/clear
 * Clear all cache or specific type
 */
const clearCache = asyncHandler(async (req, res) => {
  const { type } = req.query;
  
  await cacheService.clear(type || null);
  
  res.status(200).json({
    success: true,
    message: type ? `Cache cleared for type: ${type}` : 'All cache cleared'
  });
});

/**
 * DELETE /api/cache/customer/:id
 * Clear cache for specific customer
 */
const clearCustomerCache = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await cacheService.invalidateCustomerCache(parseInt(id));
  
  res.status(200).json({
    success: true,
    message: `Cache cleared for customer ${id}`
  });
});

/**
 * POST /api/cache/clean
 * Clean expired cache entries
 */
const cleanExpired = asyncHandler(async (req, res) => {
  const count = await cacheService.cleanExpired();
  
  res.status(200).json({
    success: true,
    message: `Cleaned ${count} expired cache entries`
  });
});

module.exports = {
  getStats,
  clearCache,
  clearCustomerCache,
  cleanExpired
};