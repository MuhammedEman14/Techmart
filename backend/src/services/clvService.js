/**
 * Customer Lifetime Value (CLV) Prediction Service
 * Predicts future value of customers based on historical behavior
 */

const { Transaction, Customer, CustomerAnalytics } = require('../models');
const { Op } = require('sequelize');
const cacheService = require('./cacheService');
/**
 * Calculate CLV for a customer
 * Formula: CLV = (Average Order Value) × (Purchase Frequency) × (Customer Lifespan in months)
 * @param {number} customerId 
 * @returns {Promise<Object>}
 */
async function calculateCustomerCLV(customerId) {
  try {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get all completed transactions
    const transactions = await Transaction.findAll({
      where: {
        customer_id: customerId,
        status: 'completed'
      },
      order: [['timestamp', 'ASC']]
    });

    if (transactions.length === 0) {
      return {
        customer_id: customerId,
        clv_predicted: 0,
        clv_confidence: 0,
        metrics: {
          average_order_value: 0,
          purchase_frequency: 0,
          customer_lifespan_months: 0,
          total_spent: 0,
          total_orders: 0
        }
      };
    }

    // Calculate metrics
    const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
    const totalOrders = transactions.length;
    const averageOrderValue = totalSpent / totalOrders;

    // Calculate customer lifespan
    const firstPurchase = new Date(transactions[0].timestamp);
    const lastPurchase = new Date(transactions[transactions.length - 1].timestamp);
    const lifespanDays = Math.max(1, Math.floor((lastPurchase - firstPurchase) / (1000 * 60 * 60 * 24)));
    const lifespanMonths = Math.max(1, lifespanDays / 30);

    // Purchase frequency (purchases per month)
    const purchaseFrequency = totalOrders / lifespanMonths;

    // Predicted lifespan (assume customer will stay for 2 years)
    const predictedLifespanMonths = 24;

    // Basic CLV calculation
    const basicCLV = averageOrderValue * purchaseFrequency * predictedLifespanMonths;

    // Apply multipliers based on customer behavior
    let clvMultiplier = 1.0;
    
    // Bonus for recent activity (purchased in last 30 days)
    const daysSinceLastPurchase = Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24));
    if (daysSinceLastPurchase <= 30) {
      clvMultiplier += 0.3; // 30% bonus
    } else if (daysSinceLastPurchase <= 60) {
      clvMultiplier += 0.15; // 15% bonus
    }

    // Bonus for high frequency
    if (purchaseFrequency >= 2) {
      clvMultiplier += 0.25; // 25% bonus for 2+ purchases per month
    } else if (purchaseFrequency >= 1) {
      clvMultiplier += 0.15; // 15% bonus for 1+ purchase per month
    }

    // Penalty for declining activity
    if (totalOrders >= 3) {
      const recentOrders = transactions.slice(-3);
      const olderOrders = transactions.slice(0, -3);
      
      if (olderOrders.length > 0) {
        const recentAvg = recentOrders.reduce((sum, t) => sum + parseFloat(t.total_amount), 0) / recentOrders.length;
        const olderAvg = olderOrders.reduce((sum, t) => sum + parseFloat(t.total_amount), 0) / olderOrders.length;
        
        if (recentAvg < olderAvg * 0.7) {
          clvMultiplier -= 0.2; // 20% penalty for declining spend
        }
      }
    }

    // Ensure multiplier doesn't go below 0.5 or above 2.0
    clvMultiplier = Math.max(0.5, Math.min(2.0, clvMultiplier));

    // Final CLV prediction
    const clvPredicted = basicCLV * clvMultiplier;

    // Confidence score (0-100) based on data quality
    const confidenceScore = calculateCLVConfidence(totalOrders, lifespanMonths, daysSinceLastPurchase);

    return {
      customer_id: customerId,
      clv_predicted: parseFloat(clvPredicted.toFixed(2)),
      clv_confidence: confidenceScore,
      clv_multiplier: parseFloat(clvMultiplier.toFixed(2)),
      metrics: {
        average_order_value: parseFloat(averageOrderValue.toFixed(2)),
        purchase_frequency: parseFloat(purchaseFrequency.toFixed(2)),
        customer_lifespan_months: parseFloat(lifespanMonths.toFixed(2)),
        predicted_lifespan_months: predictedLifespanMonths,
        total_spent: parseFloat(totalSpent.toFixed(2)),
        total_orders: totalOrders,
        days_since_last_purchase: daysSinceLastPurchase
      }
    };

  } catch (error) {
    console.error('Error calculating CLV:', error);
    throw error;
  }
}

/**
 * Calculate confidence score for CLV prediction
 * @param {number} totalOrders 
 * @param {number} lifespanMonths 
 * @param {number} daysSinceLastPurchase 
 * @returns {number} Score 0-100
 */
function calculateCLVConfidence(totalOrders, lifespanMonths, daysSinceLastPurchase) {
  let confidence = 50; // Base confidence

  // More orders = higher confidence
  if (totalOrders >= 10) confidence += 25;
  else if (totalOrders >= 5) confidence += 15;
  else if (totalOrders >= 3) confidence += 5;

  // Longer history = higher confidence
  if (lifespanMonths >= 12) confidence += 15;
  else if (lifespanMonths >= 6) confidence += 10;
  else if (lifespanMonths >= 3) confidence += 5;

  // Recent activity = higher confidence
  if (daysSinceLastPurchase <= 30) confidence += 10;
  else if (daysSinceLastPurchase <= 60) confidence += 5;
  else if (daysSinceLastPurchase > 180) confidence -= 15;

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Calculate CLV for all customers
 * @returns {Promise<Object>}
 */
async function calculateAllCustomersCLV() {
  try {
    const customers = await Customer.findAll({
      attributes: ['id']
    });

    console.log(`💰 Calculating CLV for ${customers.length} customers...`);

    let processed = 0;
    const results = {
      total: customers.length,
      processed: 0,
      failed: 0,
      total_predicted_value: 0,
      avg_clv: 0
    };

    for (const customer of customers) {
      try {
        const clvData = await calculateCustomerCLV(customer.id);
        
        // Update analytics record
        await CustomerAnalytics.update({
          clv_predicted: clvData.clv_predicted,
          clv_confidence: clvData.clv_confidence
        }, {
          where: { customer_id: customer.id }
        });

        results.total_predicted_value += clvData.clv_predicted;
        processed++;

        if (processed % 10 === 0) {
          console.log(`✅ Processed ${processed}/${customers.length} customers`);
        }

      } catch (error) {
        console.error(`Error processing customer ${customer.id}:`, error);
        results.failed++;
      }
    }

    results.processed = processed;
    results.avg_clv = results.total_predicted_value / processed;

    console.log('✅ CLV calculation complete!');
    console.log(`💰 Total Predicted Value: $${results.total_predicted_value.toFixed(2)}`);
    console.log(`💰 Average CLV: $${results.avg_clv.toFixed(2)}`);

    return results;

  } catch (error) {
    console.error('Error calculating CLV for all customers:', error);
    throw error;
  }
}

/**
 * Get CLV analysis for a customer
 * @param {number} customerId 
 * @returns {Promise<Object>}
 */
// Update getCustomerCLVAnalysis function
async function getCustomerCLVAnalysis(customerId) {
  try {
    const cacheKey = cacheService.generateCustomerKey(customerId, 'clv');
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const analytics = await CustomerAnalytics.findOne({
      where: { customer_id: customerId }
    });

    const isStale = !analytics || !analytics.last_calculated || 
      (new Date() - new Date(analytics.last_calculated)) > (7 * 24 * 60 * 60 * 1000);

    if (isStale) {
      const clvData = await calculateCustomerCLV(customerId);
      
      await CustomerAnalytics.update({
        clv_predicted: clvData.clv_predicted,
        clv_confidence: clvData.clv_confidence
      }, {
        where: { customer_id: customerId }
      });

      // Cache for 7 days
      await cacheService.set(cacheKey, clvData, 168, 'clv');
      return clvData;
    }

    const clvData = await calculateCustomerCLV(customerId);
    await cacheService.set(cacheKey, clvData, 168, 'clv');
    return clvData;

  } catch (error) {
    console.error('Error getting CLV analysis:', error);
    throw error;
  }
}

// Update getTopCustomersByCLV to use cache
async function getTopCustomersByCLV(limit = 10) {
  try {
    const cacheKey = `top-clv:limit-${limit}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const topCustomers = await CustomerAnalytics.findAll({
          include: [{
            model: Customer,
            as: 'customer',
            attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier']
          }],
          order: [['clv_predicted', 'DESC']],
          limit: limit
        });

        return topCustomers.map(record => ({
          customer: record.customer,
          clv_predicted: parseFloat(record.clv_predicted),
          clv_confidence: parseFloat(record.clv_confidence),
          rfm_segment: record.rfm_segment,
          monetary_value: parseFloat(record.monetary_value)
        }));
      },
      12, // 12 hours TTL
      'clv'
    );

  } catch (error) {
    console.error('Error getting top customers by CLV:', error);
    throw error;
  }
}
module.exports = {
  calculateCustomerCLV,
  calculateAllCustomersCLV,
  getCustomerCLVAnalysis,
  getTopCustomersByCLV,
  calculateCLVConfidence
};