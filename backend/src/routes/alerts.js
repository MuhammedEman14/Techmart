/**
 * Alert Routes
 * Routes for custom business alerts management
 */

const express = require('express');
const router = express.Router();
const { 
  createAlert, 
  getAlerts, 
  getAlertById, 
  acknowledgeAlert, 
  deleteAlert 
} = require('../controllers/alertController');
const { validateAlertCreation } = require('../middleware/validators');

/**
 * POST /api/alerts
 * Create a new custom business alert
 */
router.post('/', validateAlertCreation, createAlert);

/**
 * GET /api/alerts
 * Get all alerts with optional filters
 */
router.get('/', getAlerts);

/**
 * GET /api/alerts/:id
 * Get alert by ID
 */
router.get('/:id', getAlertById);

/**
 * PATCH /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.patch('/:id/acknowledge', acknowledgeAlert);

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete('/:id', deleteAlert);

module.exports = router;