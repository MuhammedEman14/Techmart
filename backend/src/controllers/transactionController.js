/**
 * Transaction Controller
 * Handles transaction-related requests
 */

const { 
  createTransaction, 
  getTransactionById, 
  getTransactions,
  getTopCustomersBySpending,
  getFrequentBuyers
} = require('../services/transactionService');
const { detectSuspiciousTransactions } = require('../services/fraudDetectionService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/transactions
 * Create a new transaction
 */
const create = asyncHandler(async (req, res) => {
  const transactionData = req.body;
  
  const result = await createTransaction(transactionData);
  
  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: result.transaction
  });
});

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const transaction = await getTransactionById(id);
  
  res.status(200).json({
    success: true,
    data: transaction
  });
});

/**
 * GET /api/transactions
 * Get transactions with filters
 * ✅ Updated: Fetch all transactions if no date range provided
 */
const getAll = asyncHandler(async (req, res) => {
  const { start_date, end_date, status, type, limit, page, segment } = req.query;

  // ✅ Handle segment filtering
  if (segment) {
    let result;
    if (segment === 'highest_spenders') {
      result = await getTopCustomersBySpending();
      return res.status(200).json({
        success: true,
        message: 'Fetched highest spending customers',
        data: result
      });
    } else if (segment === 'frequent_buyers') {
      result = await getFrequentBuyers();
      return res.status(200).json({
        success: true,
        message: 'Fetched frequent buyers',
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid segment type. Use highest_spenders or frequent_buyers.'
      });
    }
  }

  // ✅ Default filters for normal transactions
  const filters = {
    start_date: start_date || null,
    end_date: end_date || null,
    status: status || null,
    type: type || null,
    limit: limit ? parseInt(limit) : 50,
    page: page ? parseInt(page) : 1,
    all_time: !start_date && !end_date
  };

  const result = await getTransactions(filters);
  
  res.status(200).json({
    success: true,
    message: filters.all_time 
      ? 'Fetched all transactions (no date limit)' 
      : 'Fetched filtered transactions',
    data: result.transactions,
    pagination: result.pagination
  });
});
/**
 * GET /api/transactions/suspicious
 * Get suspicious transactions
 */
const getSuspicious = asyncHandler(async (req, res) => {
  const { limit, days, minRiskScore, fraud_type } = req.query;
  
  const options = {
    limit: limit ? parseInt(limit) : 50,
    days: days ? parseInt(days) : 30,
    minRiskScore: minRiskScore ? parseFloat(minRiskScore) : 70,
    fraud_type: fraud_type || null // 'unusual_amount', 'rapid_purchase', or null for all
  };
  
  const result = await detectSuspiciousTransactions(options);
  
  res.status(200).json({
    success: true,
    message: `Fetched ${fraud_type ? fraud_type.replace('_', ' ') : 'all suspicious'} transactions`,
    data: result
  });
});

module.exports = {
  create,
  getById,
  getAll,
  getSuspicious
};
