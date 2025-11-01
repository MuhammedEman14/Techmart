/**
 * Main Routes Index
 * Combines all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
const dashboardRoutes = require('./dashboard');
const transactionRoutes = require('./transactions');
const inventoryRoutes = require('./inventory');
const analyticsRoute = require('./analytic');
const analyticsRoutes = require('./analytics');
const alertRoutes = require('./alerts');
const abTestRoutes = require('./abTests');
const cacheRoutes = require('./cache');
const customersRoutes = require('./customers');
// Mount routes
router.use('/dashboard', dashboardRoutes);
router.use('/transactions', transactionRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/analytics', analyticsRoute);
router.use('/alerts', alertRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ab-tests', abTestRoutes);
router.use('/cache', cacheRoutes);
router.use('/customers', customersRoutes);
// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TechMart API v1.0',
    endpoints: {
      dashboard: '/api/dashboard',
      transactions: '/api/transactions',
      inventory: '/api/inventory',
      analytics: '/api/analytics',
      alerts: '/api/alerts'
    }
  });
});

module.exports = router;