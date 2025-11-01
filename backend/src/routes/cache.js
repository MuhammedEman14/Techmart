/**
 * Cache Management Routes
 */

const express = require('express');
const router = express.Router();
const cacheController = require('../controllers/cacheController');

/**
 * Cache operations
 */
router.get('/stats', cacheController.getStats);
router.delete('/clear', cacheController.clearCache);
router.delete('/customer/:id', cacheController.clearCustomerCache);
router.post('/clean', cacheController.cleanExpired);

module.exports = router;