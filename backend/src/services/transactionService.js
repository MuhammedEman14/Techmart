/**
 * Transaction Service
 * Handles transaction creation and management
 */

const { Transaction, Product, Customer } = require('../models');
const { updateStockQuantity, checkStockAvailability } = require('./inventoryService');
const { calculateTransactionRiskScore, updateCustomerRiskScore } = require('./fraudDetectionService');
const { Op , fn, col, literal } = require('sequelize');

/**
 * Create a new transaction
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Created transaction
 */
async function createTransaction(transactionData) {
  try {
    const {
      customer_id,
      product_id,
      quantity,
      payment_method,
      ip_address,
      user_agent,
      session_id
    } = transactionData;

    // Validate customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Validate product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check stock availability
    const stockCheck = await checkStockAvailability(product_id, quantity);
    if (!stockCheck.is_available) {
      throw new Error(`Insufficient stock. Only ${stockCheck.available_quantity} units available`);
    }

    // Calculate pricing
    const unit_price = parseFloat(product.price);
    const subtotal = unit_price * quantity;
    
    // Calculate tax (10% for example)
    const tax_amount = subtotal * 0.10;
    
    // Calculate shipping (free for orders over $100)
    const shipping_cost = subtotal > 100 ? 0 : 10;
    
    // No discount for now
    const discount_applied = 0;
    
    // Calculate total
    const total_amount = subtotal - discount_applied + tax_amount + shipping_cost;

    // Validate transaction amount
    const minAmount = parseFloat(process.env.MIN_TRANSACTION_AMOUNT) || 0.01;
    const maxAmount = parseFloat(process.env.MAX_TRANSACTION_AMOUNT) || 10000;

    if (total_amount < minAmount || total_amount > maxAmount) {
      throw new Error(`Transaction amount must be between $${minAmount} and $${maxAmount}`);
    }

    // Create transaction
    const transaction = await Transaction.create({
      customer_id,
      product_id,
      quantity,
      unit_price,
      total_amount,
      status: 'completed',
      payment_method,
      timestamp: new Date(),
      ip_address: ip_address || null,
      user_agent: user_agent || null,
      session_id: session_id || null,
      discount_applied,
      tax_amount,
      shipping_cost
    });

    // Update product stock
    await updateStockQuantity(product_id, quantity, 'subtract');

    // Update customer total spent
    customer.total_spent = parseFloat(customer.total_spent) + total_amount;
    await customer.save();

    // Update customer loyalty tier
    await customer.updateLoyaltyTier();

    // Calculate and update risk scores (async, don't wait)
    calculateTransactionRiskScore(transaction).catch(err => 
      console.error('Error calculating risk score:', err)
    );
    
    updateCustomerRiskScore(customer_id).catch(err =>
      console.error('Error updating customer risk score:', err)
    );

    // Fetch complete transaction with relationships
    const completeTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'email', 'first_name', 'last_name', 'loyalty_tier']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price', 'stock_quantity']
        }
      ]
    });

    return {
      success: true,
      message: 'Transaction created successfully',
      transaction: completeTransaction,
      stock_updated: true
    };

  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Get transaction by ID
 * @param {number} transactionId - Transaction ID
 * @returns {Promise<Object>} Transaction details
 */
async function getTransactionById(transactionId) {
  try {
    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'email', 'first_name', 'last_name', 'loyalty_tier', 'risk_score']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price', 'sku']
        }
      ]
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;

  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
}

/**
 * Transaction Service
 * Handles transaction creation and management
 */



/**
 * Create a new transaction
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Created transaction
 */
async function createTransaction(transactionData) {
  try {
    const {
      customer_id,
      product_id,
      quantity,
      payment_method,
      ip_address,
      user_agent,
      session_id
    } = transactionData;

    // Validate customer exists
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Validate product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check stock availability
    const stockCheck = await checkStockAvailability(product_id, quantity);
    if (!stockCheck.is_available) {
      throw new Error(`Insufficient stock. Only ${stockCheck.available_quantity} units available`);
    }

    // Calculate pricing
    const unit_price = parseFloat(product.price);
    const subtotal = unit_price * quantity;
    
    // Calculate tax (10% for example)
    const tax_amount = subtotal * 0.10;
    
    // Calculate shipping (free for orders over $100)
    const shipping_cost = subtotal > 100 ? 0 : 10;
    
    // No discount for now
    const discount_applied = 0;
    
    // Calculate total
    const total_amount = subtotal - discount_applied + tax_amount + shipping_cost;

    // Validate transaction amount
    const minAmount = parseFloat(process.env.MIN_TRANSACTION_AMOUNT) || 0.01;
    const maxAmount = parseFloat(process.env.MAX_TRANSACTION_AMOUNT) || 10000;

    if (total_amount < minAmount || total_amount > maxAmount) {
      throw new Error(`Transaction amount must be between $${minAmount} and $${maxAmount}`);
    }

    // Create transaction
    const transaction = await Transaction.create({
      customer_id,
      product_id,
      quantity,
      unit_price,
      total_amount,
      status: 'completed',
      payment_method,
      timestamp: new Date(),
      ip_address: ip_address || null,
      user_agent: user_agent || null,
      session_id: session_id || null,
      discount_applied,
      tax_amount,
      shipping_cost
    });

    // Update product stock
    await updateStockQuantity(product_id, quantity, 'subtract');

    // Update customer total spent
    customer.total_spent = parseFloat(customer.total_spent) + total_amount;
    await customer.save();

    // Update customer loyalty tier
    await customer.updateLoyaltyTier();

    // Calculate and update risk scores (async, don't wait)
    calculateTransactionRiskScore(transaction).catch(err => 
      console.error('Error calculating risk score:', err)
    );
    
    updateCustomerRiskScore(customer_id).catch(err =>
      console.error('Error updating customer risk score:', err)
    );

    // Fetch complete transaction with relationships
    const completeTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'email', 'first_name', 'last_name', 'loyalty_tier']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price', 'stock_quantity']
        }
      ]
    });

    return {
      success: true,
      message: 'Transaction created successfully',
      transaction: completeTransaction,
      stock_updated: true
    };

  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Get transaction by ID
 * @param {number} transactionId - Transaction ID
 * @returns {Promise<Object>} Transaction details
 */
async function getTransactionById(transactionId) {
  try {
    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'email', 'first_name', 'last_name', 'loyalty_tier', 'risk_score']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price', 'sku']
        }
      ]
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;

  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
}

/**
 * Get transactions with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Transactions list
 */
async function getTransactions(filters = {}) {
  try {
    const {
      customer_id,
      product_id,
      status,
      payment_method,
      start_date,
      end_date,
      min_amount,
      max_amount,
      page = 1,
      limit = 50
    } = filters;

    const whereClause = {};

    // Apply filters
    if (customer_id) whereClause.customer_id = customer_id;
    if (product_id) whereClause.product_id = product_id;
    if (status) whereClause.status = status;
    if (payment_method) whereClause.payment_method = payment_method;

    // Date range filter
    if (start_date || end_date) {
      whereClause.timestamp = {};
      if (start_date) whereClause.timestamp[Op.gte] = new Date(start_date);
      if (end_date) whereClause.timestamp[Op.lte] = new Date(end_date);
    }

    // Amount range filter
    if (min_amount || max_amount) {
      whereClause.total_amount = {};
      if (min_amount) whereClause.total_amount[Op.gte] = min_amount;
      if (max_amount) whereClause.total_amount[Op.lte] = max_amount;
    }

    // Pagination
    const offset = (page - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'email', 'first_name', 'last_name']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      transactions: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    };

  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

/**
 * Update transaction status
 * @param {number} transactionId - Transaction ID
 * @param {string} newStatus - New status
 * @returns {Promise<Object>} Updated transaction
 */
async function updateTransactionStatus(transactionId, newStatus) {
  try {
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status');
    }

    const oldStatus = transaction.status;
    transaction.status = newStatus;
    await transaction.save();

    return {
      transaction_id: transactionId,
      old_status: oldStatus,
      new_status: newStatus,
      updated_at: new Date()
    };

  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
}
async function getTopCustomersBySpending(limit = 10) {
  try {
    const result = await Transaction.findAll({
      attributes: [
        'customer_id',
        [fn('SUM', col('total_amount')), 'total_spent'],
        [fn('COUNT', col('Transaction.id')), 'total_transactions']
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier']
        }
      ],
      where: { status: 'completed' },
      group: ['customer_id'],
      order: [[literal('total_spent'), 'DESC']],
      limit
    });

    return result.map(r => ({
      customer: r.customer,
      total_spent: parseFloat(r.dataValues.total_spent).toFixed(2),
      total_transactions: parseInt(r.dataValues.total_transactions)
    }));
  } catch (error) {
    console.error('Error fetching top customers by spending:', error);
    throw error;
  }
}

/**
 * Get frequent buyers (most transactions)
 * Used for segment = "frequent_buyers"
 */
async function getFrequentBuyers(limit = 10) {
  try {
    const result = await Transaction.findAll({
      attributes: [
        'customer_id',
        [fn('COUNT', col('Transaction.id')), 'transaction_count'],
        [fn('SUM', col('total_amount')), 'total_spent']
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier']
        }
      ],
      where: { status: 'completed' },
      group: ['customer_id'],
      order: [[literal('transaction_count'), 'DESC']],
      limit
    });

    return result.map(r => ({
      customer: r.customer,
      transaction_count: parseInt(r.dataValues.transaction_count),
      total_spent: parseFloat(r.dataValues.total_spent).toFixed(2)
    }));
  } catch (error) {
    console.error('Error fetching frequent buyers:', error);
    throw error;
  }
}
module.exports = {
  createTransaction,
  getTransactionById,
  getTransactions,
  updateTransactionStatus,
  getTopCustomersBySpending,
  getFrequentBuyers
};

