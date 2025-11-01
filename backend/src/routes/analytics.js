/**
 * Analytics Routes
 * Routes for customer behavior analytics and recommendations
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * Dashboard & Overview
 */
router.get('/dashboard', analyticsController.getDashboardOverview);
router.get('/segments/overview', analyticsController.getSegments);

/**
 * Customer Analytics
 */
router.get('/customer/:id/complete', analyticsController.getCustomerCompleteAnalytics);
router.get('/customer/:id/rfm', analyticsController.getCustomerRFM);
router.get('/customer/:id/clv', analyticsController.getCustomerCLV);
router.get('/customer/:id/churn', analyticsController.getCustomerChurn);

/**
 * Customer Lists
 */
router.get('/customers/top-clv', analyticsController.getTopCLVCustomers);
router.get('/customers/high-risk', analyticsController.getHighRisk);

/**
 * Recommendations
 */
router.get('/recommendations/:customerId', analyticsController.getRecommendations);
router.get('/recommendations/product/:productId/cross-sell', analyticsController.getProductCrossSellRecommendations);

/**
 * Admin Operations
 */
router.post('/calculate-all', analyticsController.calculateAllAnalytics);

module.exports = router;