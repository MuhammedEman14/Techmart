/**
 * Dashboard Routes
 * Routes for dashboard overview endpoints
 */

const express = require('express');
const router = express.Router();
const { getOverview } = require('../controllers/dashboardController');

/**
 * GET /api/dashboard/overview
 * Summary statistics for last 24 hours (or custom time window)
 */
router.get('/overview', getOverview);

module.exports = router;