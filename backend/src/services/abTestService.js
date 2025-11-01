/**
 * A/B Testing Service
 * Framework for running A/B tests on recommendations, pricing, and features
 */

const { ABTest, Customer, Transaction, ProductRecommendation } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new A/B test
 * @param {Object} testConfig 
 * @returns {Promise<Object>}
 */
async function createABTest(testConfig) {
  try {
    const {
      test_name,
      test_type,
      variant_a,
      variant_b,
      duration_days = 30
    } = testConfig;

    // Validate test type
    const validTypes = [
      'recommendation_algorithm',
      'pricing_strategy',
      'discount_percentage',
      'ui_variant',
      'email_campaign',
      'loyalty_reward'
    ];

    if (!validTypes.includes(test_type)) {
      throw new Error(`Invalid test type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration_days);

    // Create test
    const test = await ABTest.create({
      test_name,
      test_type,
      variant_a: variant_a || { name: 'Control', description: 'Original version' },
      variant_b: variant_b || { name: 'Experiment', description: 'New version' },
      status: 'active',
      customer_assignments: {},
      metrics: {
        variant_a: {
          customers: 0,
          conversions: 0,
          revenue: 0,
          engagement_score: 0
        },
        variant_b: {
          customers: 0,
          conversions: 0,
          revenue: 0,
          engagement_score: 0
        }
      },
      start_date: startDate,
      end_date: endDate
    });

    console.log(`✅ A/B Test created: ${test_name} (ID: ${test.id})`);

    return {
      success: true,
      test: test
    };

  } catch (error) {
    console.error('Error creating A/B test:', error);
    throw error;
  }
}

/**
 * Assign customer to test variant (A or B)
 * Uses consistent hashing to ensure same customer always gets same variant
 * @param {number} testId 
 * @param {number} customerId 
 * @returns {Promise<string>}
 */
async function assignCustomerToVariant(testId, customerId) {
  try {
    const test = await ABTest.findByPk(testId);
    
    if (!test) {
      throw new Error('Test not found');
    }

    if (test.status !== 'active') {
      throw new Error('Test is not active');
    }

    // Check if customer already assigned
    const assignments = test.customer_assignments || {};
    if (assignments[customerId]) {
      return assignments[customerId];
    }

    // Assign using consistent hashing (simple modulo for now)
    // This ensures same customer always gets same variant
    const variant = (customerId % 2 === 0) ? 'variant_a' : 'variant_b';

    // Update assignments
    assignments[customerId] = variant;
    test.customer_assignments = assignments;

    // Update customer count in metrics
    const metrics = test.metrics || {};
    if (!metrics[variant]) {
      metrics[variant] = {
        customers: 0,
        conversions: 0,
        revenue: 0,
        engagement_score: 0
      };
    }
    metrics[variant].customers += 1;
    test.metrics = metrics;

    await test.save();

    return variant;

  } catch (error) {
    console.error('Error assigning customer to variant:', error);
    throw error;
  }
}

/**
 * Track conversion for A/B test
 * @param {number} testId 
 * @param {number} customerId 
 * @param {number} revenue 
 * @returns {Promise<Object>}
 */
async function trackConversion(testId, customerId, revenue = 0) {
  try {
    const test = await ABTest.findByPk(testId);
    
    if (!test) {
      throw new Error('Test not found');
    }

    // Get customer's variant
    const assignments = test.customer_assignments || {};
    const variant = assignments[customerId];

    if (!variant) {
      throw new Error('Customer not assigned to this test');
    }

    // Update metrics
    const metrics = test.metrics || {};
    if (!metrics[variant]) {
      metrics[variant] = {
        customers: 0,
        conversions: 0,
        revenue: 0,
        engagement_score: 0
      };
    }

    metrics[variant].conversions += 1;
    metrics[variant].revenue += parseFloat(revenue);
    
    // Calculate conversion rate
    metrics[variant].conversion_rate = 
      (metrics[variant].conversions / metrics[variant].customers * 100).toFixed(2);

    test.metrics = metrics;
    await test.save();

    console.log(`✅ Conversion tracked for test ${testId}, variant ${variant}`);

    return {
      success: true,
      variant,
      metrics: metrics[variant]
    };

  } catch (error) {
    console.error('Error tracking conversion:', error);
    throw error;
  }
}

/**
 * Track engagement for A/B test
 * @param {number} testId 
 * @param {number} customerId 
 * @param {number} engagementScore 
 * @returns {Promise<Object>}
 */
async function trackEngagement(testId, customerId, engagementScore) {
  try {
    const test = await ABTest.findByPk(testId);
    
    if (!test) {
      throw new Error('Test not found');
    }

    const assignments = test.customer_assignments || {};
    const variant = assignments[customerId];

    if (!variant) {
      throw new Error('Customer not assigned to this test');
    }

    // Update engagement score (running average)
    const metrics = test.metrics || {};
    const currentScore = metrics[variant].engagement_score || 0;
    const currentCount = metrics[variant].customers || 1;
    
    metrics[variant].engagement_score = 
      ((currentScore * (currentCount - 1)) + engagementScore) / currentCount;

    test.metrics = metrics;
    await test.save();

    return {
      success: true,
      variant,
      engagement_score: metrics[variant].engagement_score
    };

  } catch (error) {
    console.error('Error tracking engagement:', error);
    throw error;
  }
}

/**
 * Get A/B test results with statistical analysis
 * @param {number} testId 
 * @returns {Promise<Object>}
 */
async function getTestResults(testId) {
  try {
    const test = await ABTest.findByPk(testId);
    
    if (!test) {
      throw new Error('Test not found');
    }

    const metrics = test.metrics || {};
    const variantA = metrics.variant_a || {};
    const variantB = metrics.variant_b || {};

    // Calculate conversion rates
    const convRateA = variantA.customers > 0 
      ? (variantA.conversions / variantA.customers * 100) 
      : 0;
    
    const convRateB = variantB.customers > 0 
      ? (variantB.conversions / variantB.customers * 100) 
      : 0;

    // Calculate average revenue per customer
    const avgRevenueA = variantA.customers > 0 
      ? (variantA.revenue / variantA.customers) 
      : 0;
    
    const avgRevenueB = variantB.customers > 0 
      ? (variantB.revenue / variantB.customers) 
      : 0;

    // Calculate lift
    const conversionLift = convRateA > 0 
      ? ((convRateB - convRateA) / convRateA * 100) 
      : 0;
    
    const revenueLift = avgRevenueA > 0 
      ? ((avgRevenueB - avgRevenueA) / avgRevenueA * 100) 
      : 0;

    // Determine winner (simple comparison - in production use proper statistical tests)
    let winner = null;
    let confidence = 0;

    const totalCustomers = variantA.customers + variantB.customers;
    
    if (totalCustomers >= 30) { // Minimum sample size
      if (convRateB > convRateA * 1.1) { // 10% improvement
        winner = 'variant_b';
        confidence = Math.min(95, 50 + (totalCustomers / 10)); // Simple confidence calculation
      } else if (convRateA > convRateB * 1.1) {
        winner = 'variant_a';
        confidence = Math.min(95, 50 + (totalCustomers / 10));
      } else {
        winner = 'inconclusive';
        confidence = 0;
      }
    }

    return {
      test_id: testId,
      test_name: test.test_name,
      test_type: test.test_type,
      status: test.status,
      duration: {
        start_date: test.start_date,
        end_date: test.end_date,
        days_running: Math.floor((new Date() - new Date(test.start_date)) / (1000 * 60 * 60 * 24))
      },
      variant_a: {
        config: test.variant_a,
        customers: variantA.customers || 0,
        conversions: variantA.conversions || 0,
        conversion_rate: parseFloat(convRateA.toFixed(2)),
        revenue: parseFloat((variantA.revenue || 0).toFixed(2)),
        avg_revenue: parseFloat(avgRevenueA.toFixed(2)),
        engagement_score: parseFloat((variantA.engagement_score || 0).toFixed(2))
      },
      variant_b: {
        config: test.variant_b,
        customers: variantB.customers || 0,
        conversions: variantB.conversions || 0,
        conversion_rate: parseFloat(convRateB.toFixed(2)),
        revenue: parseFloat((variantB.revenue || 0).toFixed(2)),
        avg_revenue: parseFloat(avgRevenueB.toFixed(2)),
        engagement_score: parseFloat((variantB.engagement_score || 0).toFixed(2))
      },
      analysis: {
        conversion_lift: parseFloat(conversionLift.toFixed(2)),
        revenue_lift: parseFloat(revenueLift.toFixed(2)),
        winner: winner,
        confidence: parseFloat(confidence.toFixed(2)),
        recommendation: winner === 'variant_b' 
          ? 'Implement Variant B' 
          : winner === 'variant_a' 
            ? 'Keep Variant A' 
            : 'Continue testing - need more data'
      }
    };

  } catch (error) {
    console.error('Error getting test results:', error);
    throw error;
  }
}

/**
 * Complete an A/B test
 * @param {number} testId 
 * @returns {Promise<Object>}
 */
async function completeTest(testId) {
  try {
    const test = await ABTest.findByPk(testId);
    
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = 'completed';
    test.end_date = new Date();
    await test.save();

    const results = await getTestResults(testId);

    console.log(`✅ A/B Test completed: ${test.test_name}`);
    console.log(`Winner: ${results.analysis.winner} (${results.analysis.confidence}% confidence)`);

    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('Error completing test:', error);
    throw error;
  }
}

/**
 * Get all active tests
 * @returns {Promise<Array>}
 */
async function getActiveTests() {
  try {
    const tests = await ABTest.findAll({
      where: {
        status: 'active',
        end_date: { [Op.gte]: new Date() }
      },
      order: [['created_at', 'DESC']]
    });

    return tests;

  } catch (error) {
    console.error('Error getting active tests:', error);
    throw error;
  }
}

/**
 * Get test by ID
 * @param {number} testId 
 * @returns {Promise<Object>}
 */
async function getTestById(testId) {
  try {
    const test = await ABTest.findByPk(testId);
    
    if (!test) {
      throw new Error('Test not found');
    }

    return test;

  } catch (error) {
    console.error('Error getting test:', error);
    throw error;
  }
}

/**
 * Pause an A/B test
 * @param {number} testId 
 * @returns {Promise<Object>}
 */
async function pauseTest(testId) {
  try {
    const test = await ABTest.findByPk(testId);
    
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = 'paused';
    await test.save();

    return {
      success: true,
      message: 'Test paused successfully'
    };

  } catch (error) {
    console.error('Error pausing test:', error);
    throw error;
  }
}

/**
 * Resume a paused test
 * @param {number} testId 
 * @returns {Promise<Object>}
 */
async function resumeTest(testId) {
  try {
    const test = await ABTest.findByPk(testId);
    
    if (!test) {
      throw new Error('Test not found');
    }

    test.status = 'active';
    await test.save();

    return {
      success: true,
      message: 'Test resumed successfully'
    };

  } catch (error) {
    console.error('Error resuming test:', error);
    throw error;
  }
}

module.exports = {
  createABTest,
  assignCustomerToVariant,
  trackConversion,
  trackEngagement,
  getTestResults,
  completeTest,
  getActiveTests,
  getTestById,
  pauseTest,
  resumeTest
};