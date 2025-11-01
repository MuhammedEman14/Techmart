/**
 * Dashboard Controller
 * Handles dashboard overview requests
 */

const { getDashboardOverview } = require('../services/analyticsService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/dashboard/overview
 * Get dashboard overview statistics for last 24 hours
 */
const getOverview = asyncHandler(async (req, res) => {
  const { start_date, end_date, hours } = req.query;
  
  const filters = {
    start_date: start_date || null,
    end_date: end_date || null,
    hours: hours ? parseInt(hours) : null
  };

  const overview = await getDashboardOverview(filters);

  res.status(200).json({
    success: true,
    data: overview
  });
});

module.exports = {
  getOverview
};