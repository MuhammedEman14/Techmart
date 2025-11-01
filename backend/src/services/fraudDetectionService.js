/**
 * Fraud Detection Service
 * Implements algorithms to detect suspicious transactions
 */

const { Transaction, Customer, Product } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * Calculate risk score for a transaction
 * @param {Object} transaction - Transaction object
 * @returns {Object} Risk analysis with score and factors
 */
async function calculateTransactionRiskScore(transaction) {
  let riskScore = 0;
  const factors = [];

  // Factor 1: Unusual high transaction amount (>$5000)
  const amount = parseFloat(transaction.total_amount);
  if (amount > 5000) {
    riskScore += 30;
    factors.push('unusual_amount');
  }

  // Factor 2: Unusual round amounts (exactly $1000, $2000, etc.)
  if (amount >= 1000 && amount % 1000 === 0) {
    riskScore += 10;
    factors.push('unusual_amount');
  }

  // Factor 3: Very low amounts that might be testing (< $1)
  if (amount < 1 && amount > 0) {
    riskScore += 25;
    factors.push('test_amount');
  }

  // Factor 4: Failed payment method
  if (transaction.status === 'failed') {
    riskScore += 25;
    factors.push('failed_payment');
  }

  // Factor 5: Customer risk score
  const customer = await Customer.findByPk(transaction.customer_id);
  if (customer && customer.risk_score > 50) {
    riskScore += Math.min(customer.risk_score * 0.3, 20);
    factors.push('high_customer_risk');
  }

  // Factor 6: Check for rapid successive purchases (within 5 minutes)
  const fiveMinutesAgo = new Date(transaction.timestamp);
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 30);

  const recentTransactions = await Transaction.count({
    where: {
      customer_id: transaction.customer_id,
      timestamp: {
        [Op.gte]: fiveMinutesAgo,
        [Op.lte]: transaction.timestamp
      },
      id: {
        [Op.ne]: transaction.id
      }
    }
  });

  if (recentTransactions >= 3) {
    riskScore += 75;
    factors.push('rapid_purchases');
  } else if (recentTransactions >= 2) {
    riskScore += 50;
    factors.push('multiple_purchases');
  }

  // Factor 7: Large quantity purchases
  if (transaction.quantity > 10) {
    riskScore += 15;
    factors.push('large_quantity');
  }

  // Factor 8: Mismatched IP address patterns (if available)
  if (transaction.ip_address) {
    const previousTransactions = await Transaction.findAll({
      where: {
        customer_id: transaction.customer_id,
        ip_address: {
          [Op.ne]: transaction.ip_address,
          [Op.ne]: null
        }
      },
      limit: 5,
      order: [['timestamp', 'DESC']]
    });

    if (previousTransactions.length > 0 && previousTransactions.length >= 3) {
      riskScore += 10;
      factors.push('ip_mismatch');
    }
  }

  // Factor 9: Night time transactions (2 AM - 5 AM)
  const hour = new Date(transaction.timestamp).getHours();
  if (hour >= 2 && hour <= 5) {
    riskScore += 10;
    factors.push('unusual_time');
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  return {
    riskScore: Math.round(riskScore),
    factors
  };
}

/**
 * Detect suspicious transactions with optional fraud type filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Suspicious transactions with statistics
 */
async function detectSuspiciousTransactions(options = {}) {
  const {
    limit = 50,
    days = 30,
    minRiskScore = 70,
    fraud_type = null // 'unusual_amount', 'rapid_purchase', or null
  } = options;

  try {
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause based on fraud type
    const whereClause = {
      timestamp: {
        [Op.gte]: startDate
      }
    };

    // Pre-filter for unusual amounts if specified
    if (fraud_type === 'unusual_amount') {
      whereClause[Op.or] = [
        { total_amount: { [Op.gte]: 5000 } }, // High amounts
        { 
          total_amount: { 
            [Op.gte]: 1000,
            [Op.and]: [
              fn('MOD', col('total_amount'), 1000), // Round amounts
              { [Op.eq]: 0 }
            ]
          }
        },
        { total_amount: { [Op.lt]: 1, [Op.gt]: 0 } } // Test amounts
      ];
    }

    // Fetch transactions with related data
    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'email', 'first_name', 'last_name', 'risk_score', 'loyalty_tier']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price', 'sku']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: limit * 3 // Fetch more to filter by risk score
    });

    // Analyze transactions and calculate risk scores
    const analyzedTransactions = [];
    
    for (const transaction of transactions) {
      const analysis = await calculateTransactionRiskScore(transaction);
      
      // Apply fraud type filter if specified
      let includeTransaction = analysis.riskScore >= minRiskScore;
      
      if (includeTransaction && fraud_type) {
        if (fraud_type === 'unusual_amount') {
          // Only include if has unusual amount-related factors
          includeTransaction = analysis.factors.some(f => 
            ['unusual_amount', 'round_amount', 'test_amount'].includes(f)
          );
        } else if (fraud_type === 'rapid_purchase') {
          // Only include if has rapid purchase factors
          includeTransaction = analysis.factors.some(f => 
            ['rapid_purchases', 'multiple_purchases'].includes(f)
          );
        }
      }
      
      if (includeTransaction) {
        analyzedTransactions.push({
          id: transaction.id,
          customer_id: transaction.customer_id,
          product_id: transaction.product_id,
          customer: transaction.customer,
          product: transaction.product,
          quantity: transaction.quantity,
          unit_price: transaction.unit_price,
          total_amount: transaction.total_amount,
          status: transaction.status,
          payment_method: transaction.payment_method,
          timestamp: transaction.timestamp,
          risk_score: analysis.riskScore,
          fraud_indicators: analysis.factors, // Changed from risk_factors to match frontend
          risk_level: getRiskLevel(analysis.riskScore),
          ip_address: transaction.ip_address,
          session_id: transaction.session_id
        });
      }
    }

    // Sort by risk score (highest first) and limit results
    const suspiciousTransactions = analyzedTransactions
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, limit);

    // Calculate statistics
    const stats = {
      total_flagged: suspiciousTransactions.length,
      fraud_type: fraud_type || 'all',
      date_range: {
        from: startDate.toISOString(),
        to: new Date().toISOString()
      },
      risk_distribution: {
        critical: suspiciousTransactions.filter(t => t.risk_score >= 90).length,
        high: suspiciousTransactions.filter(t => t.risk_score >= 70 && t.risk_score < 90).length,
        medium: suspiciousTransactions.filter(t => t.risk_score >= 50 && t.risk_score < 70).length,
        low: suspiciousTransactions.filter(t => t.risk_score < 50).length
      },
      total_value_at_risk: suspiciousTransactions.reduce((sum, t) => 
        sum + parseFloat(t.total_amount), 0
      ).toFixed(2),
      unique_customers: new Set(suspiciousTransactions.map(t => t.customer_id)).size,
      common_indicators: getCommonIndicators(suspiciousTransactions)
    };

    return {
      suspicious_transactions: suspiciousTransactions,
      statistics: stats
    };

  } catch (error) {
    console.error('Error detecting suspicious transactions:', error);
    throw error;
  }
}

/**
 * Get most common fraud indicators
 * @param {Array} transactions - Analyzed transactions
 * @returns {Array} Common indicators with counts
 */
function getCommonIndicators(transactions) {
  const indicatorCounts = {};
  
  transactions.forEach(t => {
    t.fraud_indicators.forEach(indicator => {
      indicatorCounts[indicator] = (indicatorCounts[indicator] || 0) + 1;
    });
  });

  return Object.entries(indicatorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([indicator, count]) => ({ indicator, count }));
}

/**
 * Get risk level label
 * @param {number} score - Risk score
 * @returns {string} Risk level
 */
function getRiskLevel(score) {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * Update customer risk score based on transaction history
 * @param {number} customerId - Customer ID
 * @returns {Promise<Object>} Updated risk score info
 */
async function updateCustomerRiskScore(customerId) {
  try {
    const customer = await Customer.findByPk(customerId);
    
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get customer's recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await Transaction.findAll({
      where: {
        customer_id: customerId,
        timestamp: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      order: [['timestamp', 'DESC']],
      limit: 50
    });

    if (transactions.length === 0) {
      return {
        customer_id: customerId,
        risk_score: 0,
        transactions_analyzed: 0
      };
    }

    let totalRisk = 0;
    let riskFactors = 0;

    for (const transaction of transactions) {
      const analysis = await calculateTransactionRiskScore(transaction);
      totalRisk += analysis.riskScore;
      riskFactors += analysis.factors.length;
    }

    // Calculate average risk score
    const averageRisk = Math.round(totalRisk / transactions.length);
    const oldRiskScore = customer.risk_score;

    // Update customer risk score
    customer.risk_score = averageRisk;
    await customer.save();

    return {
      customer_id: customerId,
      old_risk_score: oldRiskScore,
      new_risk_score: averageRisk,
      transactions_analyzed: transactions.length,
      risk_factors_found: riskFactors
    };

  } catch (error) {
    console.error('Error updating customer risk score:', error);
    throw error;
  }
}

module.exports = {
  calculateTransactionRiskScore,
  detectSuspiciousTransactions,
  updateCustomerRiskScore,
  getRiskLevel
};