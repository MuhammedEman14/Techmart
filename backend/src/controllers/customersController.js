/**
 * Customers Controller
 * Handle customer data retrieval and search
 */

const asyncHandler = require('express-async-handler');
const { Customer, CustomerAnalytics } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/customers
 * Get all customers with optional search and filters
 */
const getAllCustomers = asyncHandler(async (req, res) => {
  const {
    limit = 100,
    offset = 0,
    search = null,
    loyalty_tier = null,
    sort_by = 'first_name',
    sort_order = 'ASC'
  } = req.query;

  const where = {};

  // Search by name or email
  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  // Filter by loyalty tier
  if (loyalty_tier) {
    where.loyalty_tier = loyalty_tier;
  }

  const customers = await Customer.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sort_by, sort_order.toUpperCase()]],
    attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier', 'created_at']
  });

  const total = await Customer.count({ where });

  res.status(200).json({
    success: true,
    data: customers,
    pagination: {
      total,
      count: customers.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

/**
 * GET /api/customers/:id
 * Get single customer by ID with analytics
 */
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await Customer.findByPk(id, {
    attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier', 'created_at'],
    include: [
      {
        model: CustomerAnalytics,
        as: 'analytics',
        required: false
      }
    ]
  });

  if (!customer) {
    res.status(404);
    throw new Error('Customer not found');
  }

  res.status(200).json({
    success: true,
    data: customer
  });
});

/**
 * GET /api/customers/search/:query
 * Quick search customers by name or email
 */
const searchCustomers = asyncHandler(async (req, res) => {
  const { query } = req.params;
  const { limit = 20 } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({
      success: false,
      error: { message: 'Search query must be at least 2 characters' }
    });
  }

  const customers = await Customer.findAll({
    where: {
      [Op.or]: [
        { first_name: { [Op.like]: `%${query}%` } },
        { last_name: { [Op.like]: `%${query}%` } },
        { email: { [Op.like]: `%${query}%` } }
      ]
    },
    limit: parseInt(limit),
    order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier']
  });

  res.status(200).json({
    success: true,
    data: customers,
    count: customers.length
  });
});

/**
 * GET /api/customers/loyalty/:tier
 * Get customers by loyalty tier
 */
const getCustomersByLoyaltyTier = asyncHandler(async (req, res) => {
  const { tier } = req.params;
  const { limit = 50 } = req.query;

  const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
  if (!validTiers.includes(tier.toLowerCase())) {
    res.status(400);
    throw new Error('Invalid loyalty tier. Must be: bronze, silver, gold, or platinum');
  }

  const customers = await Customer.findAll({
    where: { loyalty_tier: tier.toLowerCase() },
    limit: parseInt(limit),
    order: [['first_name', 'ASC']],
    attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier', 'created_at']
  });

  res.status(200).json({
    success: true,
    data: customers,
    count: customers.length,
    tier: tier.toLowerCase()
  });
});

/**
 * GET /api/customers/autocomplete/:query
 * Autocomplete search for customer selection (optimized)
 */
const autocompleteCustomers = asyncHandler(async (req, res) => {
  const { query } = req.params;
  const { limit = 10 } = req.query;

  if (!query || query.length < 1) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  const customers = await Customer.findAll({
    where: {
      [Op.or]: [
        { first_name: { [Op.like]: `${query}%` } },
        { last_name: { [Op.like]: `${query}%` } },
        { email: { [Op.like]: `${query}%` } }
      ]
    },
    limit: parseInt(limit),
    order: [['first_name', 'ASC']],
    attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier']
  });

  res.status(200).json({
    success: true,
    data: customers
  });
});

module.exports = {
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  getCustomersByLoyaltyTier,
  autocompleteCustomers
};