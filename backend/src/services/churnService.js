/**
 * Churn Risk Identification Service
 * Identifies customers at risk of churning and provides prevention strategies
 */

const { Transaction, Customer, CustomerAnalytics } = require('../models');
const { Op } = require('sequelize');

/**
 * Calculate churn risk for a customer
 * @param {number} customerId 
 * @returns {Promise<Object>}
 */
async function calculateChurnRisk(customerId) {
  try {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get transaction history
    const allTransactions = await Transaction.findAll({
      where: {
        customer_id: customerId,
        status: 'completed'
      },
      order: [['timestamp', 'DESC']]
    });

    if (allTransactions.length === 0) {
      return {
        customer_id: customerId,
        churn_risk_score: 100,
        churn_risk_level: 'critical',
        churn_indicators: ['no_purchase_history'],
        prevention_strategies: ['welcome_campaign', 'first_purchase_incentive']
      };
    }

    let churnScore = 0;
    const indicators = [];
    const preventionStrategies = [];

    // Factor 1: Recency (Most important factor)
    const lastPurchase = new Date(allTransactions[0].timestamp);
    const daysSinceLastPurchase = Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastPurchase > 180) {
      churnScore += 40;
      indicators.push('no_purchase_6_months');
      preventionStrategies.push('win_back_campaign', 'exclusive_discount');
    } else if (daysSinceLastPurchase > 90) {
      churnScore += 30;
      indicators.push('no_purchase_3_months');
      preventionStrategies.push('re_engagement_email', 'special_offer');
    } else if (daysSinceLastPurchase > 60) {
      churnScore += 15;
      indicators.push('declining_activity');
      preventionStrategies.push('reminder_email', 'loyalty_reward');
    }

    // Factor 2: Purchase frequency decline
    if (allTransactions.length >= 4) {
      const recentTransactions = allTransactions.slice(0, Math.floor(allTransactions.length / 2));
      const olderTransactions = allTransactions.slice(Math.floor(allTransactions.length / 2));
      
      const recentFrequency = calculatePurchaseFrequency(recentTransactions);
      const olderFrequency = calculatePurchaseFrequency(olderTransactions);
      
      if (recentFrequency < olderFrequency * 0.5) {
        churnScore += 25;
        indicators.push('frequency_decline_50%');
        preventionStrategies.push('personalized_recommendations');
      } else if (recentFrequency < olderFrequency * 0.7) {
        churnScore += 15;
        indicators.push('frequency_decline_30%');
      }
    }

    // Factor 3: Spending decline
    if (allTransactions.length >= 4) {
      const recentSpend = allTransactions.slice(0, Math.floor(allTransactions.length / 2))
        .reduce((sum, t) => sum + parseFloat(t.total_amount), 0) / Math.floor(allTransactions.length / 2);
      
      const olderSpend = allTransactions.slice(Math.floor(allTransactions.length / 2))
        .reduce((sum, t) => sum + parseFloat(t.total_amount), 0) / Math.ceil(allTransactions.length / 2);
      
      if (recentSpend < olderSpend * 0.6) {
        churnScore += 20;
        indicators.push('spending_decline_40%');
        preventionStrategies.push('vip_incentive', 'bundle_discount');
      } else if (recentSpend < olderSpend * 0.8) {
        churnScore += 10;
        indicators.push('spending_decline_20%');
      }
    }

    // Factor 4: Failed transactions
    const failedTransactions = await Transaction.count({
      where: {
        customer_id: customerId,
        status: 'failed',
        timestamp: {
          [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      }
    });

    if (failedTransactions >= 3) {
      churnScore += 15;
      indicators.push('multiple_failed_transactions');
      preventionStrategies.push('payment_assistance', 'customer_support_outreach');
    } else if (failedTransactions >= 1) {
      churnScore += 5;
      indicators.push('failed_transaction');
    }

    // Factor 5: Order value inconsistency
    if (allTransactions.length >= 3) {
      const amounts = allTransactions.map(t => parseFloat(t.total_amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const lastAmount = amounts[0];
      
      if (lastAmount < avgAmount * 0.5) {
        churnScore += 10;
        indicators.push('low_value_last_order');
      }
    }

    // Factor 6: Customer loyalty tier
    if (customer.loyalty_tier === 'Bronze' || !customer.loyalty_tier) {
      churnScore += 10;
      indicators.push('low_loyalty_tier');
      preventionStrategies.push('loyalty_upgrade_offer');
    }

    // Cap score at 100
    churnScore = Math.min(100, churnScore);

    // Determine risk level
    let riskLevel;
    if (churnScore >= 70) {
      riskLevel = 'critical';
    } else if (churnScore >= 50) {
      riskLevel = 'high';
    } else if (churnScore >= 30) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Add general prevention strategies
    if (indicators.length === 0) {
      preventionStrategies.push('maintain_engagement');
    }

    return {
      customer_id: customerId,
      churn_risk_score: churnScore,
      churn_risk_level: riskLevel,
      churn_indicators: indicators,
      prevention_strategies: [...new Set(preventionStrategies)], // Remove duplicates
      days_since_last_purchase: daysSinceLastPurchase,
      total_transactions: allTransactions.length
    };

  } catch (error) {
    console.error('Error calculating churn risk:', error);
    throw error;
  }
}

/**
 * Calculate purchase frequency (purchases per month)
 * @param {Array} transactions 
 * @returns {number}
 */
function calculatePurchaseFrequency(transactions) {
  if (transactions.length < 2) return 0;
  
  const firstDate = new Date(transactions[transactions.length - 1].timestamp);
  const lastDate = new Date(transactions[0].timestamp);
  const monthsDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30));
  
  return transactions.length / monthsDiff;
}

/**
 * Calculate churn risk for all customers
 * @returns {Promise<Object>}
 */
async function calculateAllCustomersChurnRisk() {
  try {
    const customers = await Customer.findAll({
      attributes: ['id']
    });

    console.log(`⚠️  Calculating churn risk for ${customers.length} customers...`);

    let processed = 0;
    const results = {
      total: customers.length,
      processed: 0,
      failed: 0,
      risk_distribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    for (const customer of customers) {
      try {
        const churnData = await calculateChurnRisk(customer.id);
        
        // Update analytics record
        await CustomerAnalytics.update({
          churn_risk_score: churnData.churn_risk_score,
          churn_risk_level: churnData.churn_risk_level,
          churn_indicators: churnData.churn_indicators
        }, {
          where: { customer_id: customer.id }
        });

        results.risk_distribution[churnData.churn_risk_level]++;
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

    console.log('✅ Churn risk calculation complete!');
    console.log('📊 Risk Distribution:', results.risk_distribution);

    return results;

  } catch (error) {
    console.error('Error calculating churn risk for all customers:', error);
    throw error;
  }
}

/**
 * Get churn risk analysis for a customer
 * @param {number} customerId 
 * @returns {Promise<Object>}
 */
async function getCustomerChurnAnalysis(customerId) {
  try {
    // Always calculate fresh churn risk (it's fast)
    const churnData = await calculateChurnRisk(customerId);
    
    // Update database
    await CustomerAnalytics.update({
      churn_risk_score: churnData.churn_risk_score,
      churn_risk_level: churnData.churn_risk_level,
      churn_indicators: churnData.churn_indicators
    }, {
      where: { customer_id: customerId }
    });

    return churnData;

  } catch (error) {
    console.error('Error getting churn analysis:', error);
    throw error;
  }
}

/**
 * Get customers at high risk of churning
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getHighRiskCustomers(limit = 20) {
  try {
    const highRiskCustomers = await CustomerAnalytics.findAll({
      where: {
        churn_risk_level: {
          [Op.in]: ['critical', 'high']
        }
      },
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier']
      }],
      order: [['churn_risk_score', 'DESC']],
      limit: limit
    });

    return highRiskCustomers.map(record => ({
      customer: record.customer,
      churn_risk_score: record.churn_risk_score,
      churn_risk_level: record.churn_risk_level,
      churn_indicators: record.churn_indicators,
      rfm_segment: record.rfm_segment,
      monetary_value: parseFloat(record.monetary_value || 0),
      clv_predicted: parseFloat(record.clv_predicted || 0)
    }));

  } catch (error) {
    console.error('Error getting high risk customers:', error);
    throw error;
  }
}

/**
 * Get prevention strategy details
 * @param {string} strategyKey 
 * @returns {Object}
 */
function getPreventionStrategyDetails(strategyKey) {
  const strategies = {
    'win_back_campaign': {
      title: 'Win-Back Campaign',
      description: 'Send personalized email with special comeback offer',
      discount: '20-30%',
      timing: 'immediate'
    },
    'exclusive_discount': {
      title: 'Exclusive Discount',
      description: 'VIP discount code for next purchase',
      discount: '25%',
      timing: 'immediate'
    },
    're_engagement_email': {
      title: 'Re-engagement Email',
      description: 'Reminder email with product recommendations',
      discount: '10-15%',
      timing: 'within 24 hours'
    },
    'special_offer': {
      title: 'Special Limited Offer',
      description: 'Time-limited special pricing on popular items',
      discount: '15%',
      timing: 'within 48 hours'
    },
    'reminder_email': {
      title: 'Gentle Reminder',
      description: 'Check-in email with new arrivals',
      discount: '10%',
      timing: 'within 7 days'
    },
    'loyalty_reward': {
      title: 'Loyalty Reward',
      description: 'Bonus loyalty points or free gift',
      discount: 'points/gift',
      timing: 'immediate'
    },
    'personalized_recommendations': {
      title: 'Personalized Recommendations',
      description: 'AI-powered product suggestions based on history',
      discount: '0%',
      timing: 'ongoing'
    },
    'vip_incentive': {
      title: 'VIP Incentive',
      description: 'Upgrade to VIP status with benefits',
      discount: 'tier upgrade',
      timing: 'immediate'
    },
    'bundle_discount': {
      title: 'Bundle Discount',
      description: 'Special pricing on product bundles',
      discount: '20%',
      timing: 'within 72 hours'
    },
    'payment_assistance': {
      title: 'Payment Assistance',
      description: 'Help resolving payment issues',
      discount: '0%',
      timing: 'immediate'
    },
    'customer_support_outreach': {
      title: 'Support Outreach',
      description: 'Proactive customer support contact',
      discount: '0%',
      timing: 'within 24 hours'
    },
    'loyalty_upgrade_offer': {
      title: 'Loyalty Tier Upgrade',
      description: 'Special offer to upgrade loyalty status',
      discount: 'tier benefits',
      timing: 'within 48 hours'
    },
    'welcome_campaign': {
      title: 'Welcome Campaign',
      description: 'New customer onboarding series',
      discount: '15%',
      timing: 'immediate'
    },
    'first_purchase_incentive': {
      title: 'First Purchase Incentive',
      description: 'Special discount for first order',
      discount: '20%',
      timing: 'immediate'
    },
    'maintain_engagement': {
      title: 'Maintain Engagement',
      description: 'Regular updates and exclusive content',
      discount: '0%',
      timing: 'ongoing'
    }
  };

  return strategies[strategyKey] || {
    title: strategyKey,
    description: 'Custom retention strategy',
    discount: 'varies',
    timing: 'as needed'
  };
}

module.exports = {
  calculateChurnRisk,
  calculateAllCustomersChurnRisk,
  getCustomerChurnAnalysis,
  getHighRiskCustomers,
  getPreventionStrategyDetails,
  calculatePurchaseFrequency
};