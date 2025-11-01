/**
 * Transaction Routes
 * Routes for transaction-related operations
 */

const express = require('express');
const router = express.Router();
const { 
  create, 
  getById, 
  getAll, 
  getSuspicious 
} = require('../controllers/transactionController');
const { 
  validateTransactionCreation,
  validateSuspiciousQuery 
} = require('../middleware/validators');

/**
 * POST /api/transactions
 * Create a new transaction with validation
 */
router.post('/', validateTransactionCreation, create);

/**
 * GET /api/transactions
 * Get all transactions with filters
 */
router.get('/', getAll);

/**
 * GET /api/transactions/suspicious
 * Detect potentially fraudulent transactions
 */
router.get('/suspicious', validateSuspiciousQuery, getSuspicious);

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
router.get('/:id', getById);

module.exports = router;