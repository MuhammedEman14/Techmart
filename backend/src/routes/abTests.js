/**
 * A/B Testing Routes
 */

const express = require('express');
const router = express.Router();
const abTestController = require('../controllers/abTestController');

/**
 * Test Management
 */
router.post('/', abTestController.create);
router.get('/', abTestController.getAll);
router.get('/:id', abTestController.getById);
router.get('/:id/results', abTestController.getResults);

/**
 * Test Operations
 */
router.post('/:id/assign/:customerId', abTestController.assignCustomer);
router.post('/:id/conversion', abTestController.recordConversion);
router.post('/:id/engagement', abTestController.recordEngagement);
router.post('/:id/complete', abTestController.complete);
router.post('/:id/pause', abTestController.pause);
router.post('/:id/resume', abTestController.resume);

module.exports = router;