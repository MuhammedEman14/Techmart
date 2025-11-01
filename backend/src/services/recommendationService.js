/**
 * Recommendation Engine Service
 * Provides personalized product recommendations using multiple algorithms
 */

const { Transaction, Product, Customer, ProductRecommendation, CustomerAnalytics } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const cacheService = require('./cacheService');
/**
 * Generate personalized recommendations for a customer
 * Hybrid approach combining multiple algorithms
 * @param {number} customerId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
// Update generatePersonalizedRecommendations function
async function generatePersonalizedRecommendations(customerId, limit = 5) {
  try {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const cacheKey = cacheService.generateCustomerKey(customerId, 'recommendations');
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached.slice(0, limit);
    }

    // Check database cache
    const cachedRecommendations = await getCachedRecommendations(customerId);
    if (cachedRecommendations && cachedRecommendations.length > 0) {
      const result = cachedRecommendations.slice(0, limit);
      await cacheService.set(cacheKey, result, 12, 'recommendations');
      return result;
    }

    console.log(`🎯 Generating recommendations for customer ${customerId}...`);

    const customerTransactions = await Transaction.findAll({
      where: {
        customer_id: customerId,
        status: 'completed'
      },
      include: [{
        model: Product,
        as: 'product'
      }]
    });

    const purchasedProductIds = customerTransactions.map(t => t.product_id);

    const affinityRecommendations = await getProductAffinityRecommendations(
      purchasedProductIds,
      limit * 2
    );

    const collaborativeRecommendations = await getCollaborativeFilteringRecommendations(
      customerId,
      purchasedProductIds,
      limit * 2
    );

    const segmentRecommendations = await getSegmentBasedRecommendations(
      customerId,
      purchasedProductIds,
      limit * 2
    );

    const combinedRecommendations = combineRecommendations(
      affinityRecommendations,
      collaborativeRecommendations,
      segmentRecommendations,
      {
        affinity: 0.4,
        collaborative: 0.3,
        segment: 0.3
      }
    );

    const topRecommendations = combinedRecommendations.slice(0, limit);

    await cacheRecommendations(customerId, topRecommendations);
    
    // Cache in memory too
    await cacheService.set(cacheKey, topRecommendations, 12, 'recommendations');

    return topRecommendations;

  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}
/**
 * Product Affinity: Frequently bought together
 * @param {Array} purchasedProductIds 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getProductAffinityRecommendations(purchasedProductIds, limit = 10) {
  try {
    if (purchasedProductIds.length === 0) {
      return [];
    }

    // Find products that were purchased by customers who also bought the same products
    const affinityProducts = await Transaction.findAll({
      attributes: [
        'product_id',
        [fn('COUNT', col('product_id')), 'purchase_count']
      ],
      where: {
        status: 'completed',
        customer_id: {
          [Op.in]: literal(`(
            SELECT DISTINCT customer_id 
            FROM transactions 
            WHERE product_id IN (${purchasedProductIds.join(',')})
            AND status = 'completed'
          )`)
        },
        product_id: {
          [Op.notIn]: purchasedProductIds
        }
      },
      group: ['product_id'],
      order: [[literal('purchase_count'), 'DESC']],
      limit: limit,
      raw: true
    });

    // Get full product details
    const productIds = affinityProducts.map(p => p.product_id);
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        stock_quantity: { [Op.gt]: 0 }
      }
    });

    return products.map(product => {
      const affinityData = affinityProducts.find(p => p.product_id === product.id);
      return {
        product: product,
        score: parseFloat(affinityData.purchase_count) || 1,
        type: 'affinity',
        reason: 'Frequently bought together with your previous purchases'
      };
    });

  } catch (error) {
    console.error('Error in product affinity recommendations:', error);
    return [];
  }
}

/**
 * Collaborative Filtering: Based on similar customers
 * @param {number} customerId 
 * @param {Array} purchasedProductIds 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getCollaborativeFilteringRecommendations(customerId, purchasedProductIds, limit = 10) {
  try {
    // Get customer's RFM segment
    const analytics = await CustomerAnalytics.findOne({
      where: { customer_id: customerId }
    });

    if (!analytics || !analytics.rfm_segment) {
      return [];
    }

    // Find similar customers (same segment)
    const similarCustomers = await CustomerAnalytics.findAll({
      where: {
        rfm_segment: analytics.rfm_segment,
        customer_id: { [Op.ne]: customerId }
      },
      limit: 50
    });

    const similarCustomerIds = similarCustomers.map(c => c.customer_id);

    if (similarCustomerIds.length === 0) {
      return [];
    }

    // Find popular products among similar customers
    const popularProducts = await Transaction.findAll({
      attributes: [
        'product_id',
        [fn('COUNT', col('product_id')), 'popularity_count']
      ],
      where: {
        customer_id: { [Op.in]: similarCustomerIds },
        product_id: { [Op.notIn]: purchasedProductIds },
        status: 'completed'
      },
      group: ['product_id'],
      order: [[literal('popularity_count'), 'DESC']],
      limit: limit,
      raw: true
    });

    // Get full product details
    const productIds = popularProducts.map(p => p.product_id);
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        stock_quantity: { [Op.gt]: 0 }
      }
    });

    return products.map(product => {
      const popularityData = popularProducts.find(p => p.product_id === product.id);
      return {
        product: product,
        score: parseFloat(popularityData.popularity_count) || 1,
        type: 'collaborative',
        reason: `Popular among ${analytics.rfm_segment} customers like you`
      };
    });

  } catch (error) {
    console.error('Error in collaborative filtering:', error);
    return [];
  }
}

/**
 * Segment-Based: Popular products in customer's segment
 * @param {number} customerId 
 * @param {Array} purchasedProductIds 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getSegmentBasedRecommendations(customerId, purchasedProductIds, limit = 10) {
  try {
    // Get customer analytics
    const analytics = await CustomerAnalytics.findOne({
      where: { customer_id: customerId }
    });

    if (!analytics) {
      return [];
    }

    // Get all customers in the same segment
    const segmentCustomers = await CustomerAnalytics.findAll({
      where: {
        rfm_segment: analytics.rfm_segment
      },
      attributes: ['customer_id']
    });

    const segmentCustomerIds = segmentCustomers.map(c => c.customer_id);

    // Find top products in this segment
    const topProducts = await Transaction.findAll({
      attributes: [
        'product_id',
        [fn('COUNT', col('product_id')), 'segment_count'],
        [fn('SUM', col('total_amount')), 'total_revenue']
      ],
      where: {
        customer_id: { [Op.in]: segmentCustomerIds },
        product_id: { [Op.notIn]: purchasedProductIds },
        status: 'completed'
      },
      group: ['product_id'],
      order: [[literal('segment_count'), 'DESC']],
      limit: limit,
      raw: true
    });

    // Get full product details
    const productIds = topProducts.map(p => p.product_id);
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        stock_quantity: { [Op.gt]: 0 }
      }
    });

    return products.map(product => {
      const productData = topProducts.find(p => p.product_id === product.id);
      return {
        product: product,
        score: parseFloat(productData.segment_count) || 1,
        type: 'segment',
        reason: `Top choice for ${analytics.rfm_segment} segment`
      };
    });

  } catch (error) {
    console.error('Error in segment-based recommendations:', error);
    return [];
  }
}

/**
 * Combine recommendations from multiple algorithms with weighted scoring
 * @param {Array} affinity 
 * @param {Array} collaborative 
 * @param {Array} segment 
 * @param {Object} weights 
 * @returns {Array}
 */
function combineRecommendations(affinity, collaborative, segment, weights) {
  const productScores = new Map();

  // Process affinity recommendations
  affinity.forEach(rec => {
    const key = rec.product.id;
    const normalizedScore = normalizeScore(rec.score, affinity);
    productScores.set(key, {
      product: rec.product,
      totalScore: normalizedScore * weights.affinity,
      reasons: [rec.reason],
      types: [rec.type]
    });
  });

  // Process collaborative recommendations
  collaborative.forEach(rec => {
    const key = rec.product.id;
    const normalizedScore = normalizeScore(rec.score, collaborative);
    
    if (productScores.has(key)) {
      const existing = productScores.get(key);
      existing.totalScore += normalizedScore * weights.collaborative;
      existing.reasons.push(rec.reason);
      existing.types.push(rec.type);
    } else {
      productScores.set(key, {
        product: rec.product,
        totalScore: normalizedScore * weights.collaborative,
        reasons: [rec.reason],
        types: [rec.type]
      });
    }
  });

  // Process segment recommendations
  segment.forEach(rec => {
    const key = rec.product.id;
    const normalizedScore = normalizeScore(rec.score, segment);
    
    if (productScores.has(key)) {
      const existing = productScores.get(key);
      existing.totalScore += normalizedScore * weights.segment;
      existing.reasons.push(rec.reason);
      existing.types.push(rec.type);
    } else {
      productScores.set(key, {
        product: rec.product,
        totalScore: normalizedScore * weights.segment,
        reasons: [rec.reason],
        types: [rec.type]
      });
    }
  });

  // Convert to array and sort by total score
  const recommendations = Array.from(productScores.values())
    .map(item => ({
      product: item.product,
      recommendation_score: parseFloat((item.totalScore * 100).toFixed(2)),
      recommendation_types: [...new Set(item.types)],
      reasons: item.reasons
    }))
    .sort((a, b) => b.recommendation_score - a.recommendation_score);

  return recommendations;
}

/**
 * Normalize scores to 0-1 range
 * @param {number} score 
 * @param {Array} allScores 
 * @returns {number}
 */
function normalizeScore(score, allScores) {
  if (allScores.length === 0) return 0;
  
  const scores = allScores.map(s => s.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  if (maxScore === minScore) return 1;
  
  return (score - minScore) / (maxScore - minScore);
}

/**
 * Get cached recommendations
 * @param {number} customerId 
 * @returns {Promise<Array|null>}
 */
async function getCachedRecommendations(customerId) {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    const cached = await ProductRecommendation.findAll({
      where: {
        customer_id: customerId,
        generated_at: { [Op.gte]: twelveHoursAgo }
      },
      include: [{
        model: Product,
        as: 'product'
      }],
      order: [['recommendation_score', 'DESC']]
    });

    if (cached.length > 0) {
      console.log(`✅ Using cached recommendations for customer ${customerId}`);
      return cached.map(rec => ({
        product: rec.product,
        recommendation_score: parseFloat(rec.recommendation_score),
        recommendation_type: rec.recommendation_type,
        reason: rec.reason
      }));
    }

    return null;

  } catch (error) {
    console.error('Error getting cached recommendations:', error);
    return null;
  }
}

/**
 * Cache recommendations
 * @param {number} customerId 
 * @param {Array} recommendations 
 */
async function cacheRecommendations(customerId, recommendations) {
  try {
    // Delete old recommendations
    await ProductRecommendation.destroy({
      where: { customer_id: customerId }
    });

    // Insert new recommendations
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
    
    const records = recommendations.map(rec => ({
      customer_id: customerId,
      product_id: rec.product.id,
      recommendation_score: rec.recommendation_score,
      recommendation_type: rec.recommendation_types ? rec.recommendation_types.join(',') : 'hybrid',
      reason: rec.reasons ? rec.reasons[0] : 'Recommended for you',
      generated_at: new Date(),
      expires_at: expiresAt
    }));

    await ProductRecommendation.bulkCreate(records);
    console.log(`✅ Cached ${records.length} recommendations for customer ${customerId}`);

  } catch (error) {
    console.error('Error caching recommendations:', error);
  }
}

/**
 * Get product cross-sell recommendations
 * @param {number} productId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getProductCrossSell(productId, limit = 5) {
  try {
    // Find customers who bought this product
    const customersWhoBought = await Transaction.findAll({
      where: {
        product_id: productId,
        status: 'completed'
      },
      attributes: ['customer_id'],
      group: ['customer_id']
    });

    const customerIds = customersWhoBought.map(t => t.customer_id);

    if (customerIds.length === 0) {
      return [];
    }

    // Find what else these customers bought
    const otherProducts = await Transaction.findAll({
      attributes: [
        'product_id',
        [fn('COUNT', col('product_id')), 'cross_sell_count']
      ],
      where: {
        customer_id: { [Op.in]: customerIds },
        product_id: { [Op.ne]: productId },
        status: 'completed'
      },
      group: ['product_id'],
      order: [[literal('cross_sell_count'), 'DESC']],
      limit: limit,
      raw: true
    });

    // Get product details
    const productIds = otherProducts.map(p => p.product_id);
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        stock_quantity: { [Op.gt]: 0 }
      }
    });

    return products.map(product => {
      const crossSellData = otherProducts.find(p => p.product_id === product.id);
      return {
        product: product,
        cross_sell_count: parseInt(crossSellData.cross_sell_count),
        affinity_score: parseFloat(crossSellData.cross_sell_count) / customerIds.length * 100
      };
    });

  } catch (error) {
    console.error('Error getting cross-sell recommendations:', error);
    throw error;
  }
}

/**
 * Generate recommendations for all customers (batch process)
 * @returns {Promise<Object>}
 */
async function generateAllRecommendations() {
  try {
    const customers = await Customer.findAll({
      attributes: ['id']
    });

    console.log(`🎯 Generating recommendations for ${customers.length} customers...`);

    let processed = 0;
    const results = {
      total: customers.length,
      processed: 0,
      failed: 0
    };

    for (const customer of customers) {
      try {
        await generatePersonalizedRecommendations(customer.id, 10);
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
    console.log('✅ Recommendation generation complete!');

    return results;

  } catch (error) {
    console.error('Error generating all recommendations:', error);
    throw error;
  }
}

module.exports = {
  generatePersonalizedRecommendations,
  getProductAffinityRecommendations,
  getCollaborativeFilteringRecommendations,
  getSegmentBasedRecommendations,
  getProductCrossSell,
  generateAllRecommendations,
  combineRecommendations
};