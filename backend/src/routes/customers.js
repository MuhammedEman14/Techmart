/**
 * Customer Routes
 * Handle customer data retrieval and search
 */

const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  getCustomersByLoyaltyTier,
  autocompleteCustomers
} = require('../controllers/customersController');

/**
 * @route   GET /api/customers
 * @desc    Get all customers with optional filters
 * @query   limit, offset, search, loyalty_tier, sort_by, sort_order
 */
router.get('/', getAllCustomers);

/**
 * @route   GET /api/customers/search/:query
 * @desc    Search customers by name or email
 * @param   query - Search term
 */
router.get('/search/:query', searchCustomers);

/**
 * @route   GET /api/customers/autocomplete/:query
 * @desc    Autocomplete search for customer selection
 * @param   query - Search term (starts with)
 */
router.get('/autocomplete/:query', autocompleteCustomers);

/**
 * @route   GET /api/customers/loyalty/:tier
 * @desc    Get customers by loyalty tier
 * @param   tier - bronze, silver, gold, or platinum
 */
router.get('/loyalty/:tier', getCustomersByLoyaltyTier);

/**
 * @route   GET /api/customers/:id
 * @desc    Get single customer by ID
 * @param   id - Customer ID
 */
router.get('/:id', getCustomerById);

module.exports = router;