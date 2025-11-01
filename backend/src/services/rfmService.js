/**
 * RFM Analysis Service
 * Calculates Recency, Frequency, Monetary scores for customer segmentation
 */

const { Transaction, Customer, CustomerAnalytics } = require('../models');
const { Op } = require('sequelize');
const cacheService = require('./cacheService');
/**
 * Calculate RFM scores for a single customer
 * @param {number} customerId 
 * @returns {Promise<Object>} RFM analysis
 */
async function calculateCustomerRFM(customerId) {
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
      order: [['timestamp', 'DESC']]
    });

    if (transactions.length === 0) {
      return {
        customer_id: customerId,
        recency_days: 9999,
        recency_score: 1,
        frequency_count: 0,
        frequency_score: 1,
        monetary_value: 0,
        monetary_score: 1,
        rfm_score: 3,
        rfm_segment: 'Lost'
      };
    }

    // RECENCY: Days since last purchase
    const lastPurchase = new Date(transactions[0].timestamp);
    const today = new Date();
    const recencyDays = Math.floor((today - lastPurchase) / (1000 * 60 * 60 * 24));

    // FREQUENCY: Total number of purchases
    const frequencyCount = transactions.length;

    // MONETARY: Total amount spent
    const monetaryValue = transactions.reduce((sum, t) => 
      sum + parseFloat(t.total_amount), 0
    );

    // Calculate scores (1-5 scale)
    const recencyScore = calculateRecencyScore(recencyDays);
    const frequencyScore = calculateFrequencyScore(frequencyCount);
    const monetaryScore = calculateMonetaryScore(monetaryValue);

    // Combined RFM score
    const rfmScore = recencyScore + frequencyScore + monetaryScore;

    // Determine segment
    const rfmSegment = determineSegment(rfmScore, recencyScore, frequencyScore, monetaryScore);

    return {
      customer_id: customerId,
      recency_days: recencyDays,
      recency_score: recencyScore,
      frequency_count: frequencyCount,
      frequency_score: frequencyScore,
      monetary_value: parseFloat(monetaryValue.toFixed(2)),
      monetary_score: monetaryScore,
      rfm_score: rfmScore,
      rfm_segment: rfmSegment
    };

  } catch (error) {
    console.error('Error calculating RFM for customer:', error);
    throw error;
  }
}

/**
 * Calculate recency score based on days since last purchase
 * @param {number} days 
 * @returns {number} Score 1-5
 */
function calculateRecencyScore(days) {
  if (days <= 30) return 5;      // Within last month
  if (days <= 60) return 4;      // Within 2 months
  if (days <= 90) return 3;      // Within 3 months
  if (days <= 180) return 2;     // Within 6 months
  return 1;                       // More than 6 months
}

/**
 * Calculate frequency score based on number of purchases
 * @param {number} count 
 * @returns {number} Score 1-5
 */
function calculateFrequencyScore(count) {
  if (count >= 20) return 5;     // 20+ purchases
  if (count >= 10) return 4;     // 10-19 purchases
  if (count >= 5) return 3;      // 5-9 purchases
  if (count >= 2) return 2;      // 2-4 purchases
  return 1;                       // 1 purchase
}

/**
 * Calculate monetary score based on total spend
 * @param {number} amount 
 * @returns {number} Score 1-5
 */
function calculateMonetaryScore(amount) {
  if (amount >= 10000) return 5;  // $10,000+
  if (amount >= 5000) return 4;   // $5,000-$9,999
  if (amount >= 2000) return 3;   // $2,000-$4,999
  if (amount >= 500) return 2;    // $500-$1,999
  return 1;                        // < $500
}

/**
 * Determine customer segment based on RFM scores
 * @param {number} rfmScore 
 * @param {number} r 
 * @param {number} f 
 * @param {number} m 
 * @returns {string} Segment name
 */
function determineSegment(rfmScore, r, f, m) {
  // Champions: High RFM across the board
  if (rfmScore >= 13 && r >= 4 && f >= 4 && m >= 4) {
    return 'Champions';
  }
  
  // Loyal Customers: Good frequency and monetary, decent recency
  if (rfmScore >= 10 && f >= 3 && m >= 3) {
    return 'Loyal';
  }
  
  // At Risk: Good past behavior but low recency
  if (rfmScore >= 8 && r <= 2 && (f >= 3 || m >= 3)) {
    return 'At Risk';
  }
  
  // Lost: Low scores across the board
  if (rfmScore <= 7 || r === 1) {
    return 'Lost';
  }
  
  // Potential Loyalists: Mid-range scores
  return 'Potential';
}

/**
 * Calculate RFM for all customers
 * @returns {Promise<Object>} Summary statistics
 */
async function calculateAllCustomersRFM() {
  try {
    const customers = await Customer.findAll({
      attributes: ['id']
    });

    console.log(`📊 Calculating RFM for ${customers.length} customers...`);

    let processed = 0;
    const results = {
      total: customers.length,
      processed: 0,
      failed: 0,
      segments: {
        Champions: 0,
        Loyal: 0,
        Potential: 0,
        'At Risk': 0,
        Lost: 0
      }
    };

    for (const customer of customers) {
      try {
        const rfmData = await calculateCustomerRFM(customer.id);
        
        // Save to database
        await CustomerAnalytics.upsert({
          customer_id: customer.id,
          recency_score: rfmData.recency_score,
          frequency_score: rfmData.frequency_score,
          monetary_score: rfmData.monetary_score,
          rfm_score: rfmData.rfm_score,
          rfm_segment: rfmData.rfm_segment,
          recency_days: rfmData.recency_days,
          frequency_count: rfmData.frequency_count,
          monetary_value: rfmData.monetary_value,
          last_calculated: new Date()
        });

        results.segments[rfmData.rfm_segment]++;
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
    console.log('✅ RFM calculation complete!');
    console.log('📊 Segment Distribution:', results.segments);

    return results;

  } catch (error) {
    console.error('Error calculating RFM for all customers:', error);
    throw error;
  }
}

/**
 * Get RFM analysis for a customer
 * @param {number} customerId 
 * @returns {Promise<Object>}
 */
// Update getCustomerRFMAnalysis function
async function getCustomerRFMAnalysis(customerId) {
  try {
    const cacheKey = cacheService.generateCustomerKey(customerId, 'rfm');
    
    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    let analytics = await CustomerAnalytics.findOne({
      where: { customer_id: customerId },
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier']
      }]
    });

    // If no analytics exist or data is stale (> 24 hours), recalculate
    if (!analytics || isDataStale(analytics.last_calculated, 24)) {
      const rfmData = await calculateCustomerRFM(customerId);
      
      analytics = await CustomerAnalytics.upsert({
        customer_id: customerId,
        ...rfmData,
        last_calculated: new Date()
      }, {
        returning: true
      });

      analytics = await CustomerAnalytics.findOne({
        where: { customer_id: customerId },
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'loyalty_tier']
        }]
      });
    }

    // Cache the result
    await cacheService.set(cacheKey, analytics, 24, 'rfm');

    return analytics;

  } catch (error) {
    console.error('Error getting RFM analysis:', error);
    throw error;
  }
}

/**
 * Get segment overview statistics
 * @returns {Promise<Object>}
 */
async function getSegmentOverview() {
  try {
    const cacheKey = 'segments:overview';
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const segments = await CustomerAnalytics.findAll({
          attributes: [
            'rfm_segment',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
            [require('sequelize').fn('SUM', require('sequelize').col('monetary_value')), 'total_value'],
            [require('sequelize').fn('AVG', require('sequelize').col('rfm_score')), 'avg_rfm_score']
          ],
          group: ['rfm_segment'],
          raw: true  // IMPORTANT: Get plain objects
        });

        const overview = {
          total_customers: 0,
          segments: {}
        };

        segments.forEach(segment => {
          const segmentName = segment.rfm_segment || 'Unknown';
          const count = parseInt(segment.count || 0);
          
          overview.segments[segmentName] = {
            count: count,
            total_value: parseFloat(segment.total_value || 0).toFixed(2),
            avg_rfm_score: parseFloat(segment.avg_rfm_score || 0).toFixed(2),
            percentage: 0
          };
          
          overview.total_customers += count;
        });

        // Calculate percentages
        Object.keys(overview.segments).forEach(segment => {
          overview.segments[segment].percentage = 
            overview.total_customers > 0 
              ? ((overview.segments[segment].count / overview.total_customers) * 100).toFixed(2)
              : '0';
        });

        return overview; // Return plain object, not stringified
      },
      6,
      'segments'
    );

  } catch (error) {
    console.error('Error getting segment overview:', error);
    throw error;
  }
}
/**
 * Check if data is stale
 * @param {Date} lastCalculated 
 * @param {number} hours 
 * @returns {boolean}
 */
function isDataStale(lastCalculated, hours = 24) {
  if (!lastCalculated) return true;
  const now = new Date();
  const diff = now - new Date(lastCalculated);
  const hoursDiff = diff / (1000 * 60 * 60);
  return hoursDiff > hours;
}

module.exports = {
  calculateCustomerRFM,
  calculateAllCustomersRFM,
  getCustomerRFMAnalysis,
  getSegmentOverview,
  calculateRecencyScore,
  calculateFrequencyScore,
  calculateMonetaryScore,
  determineSegment
};