/**
 * Analytics Controller
 * Handles customer analytics and recommendations requests
 */

const { asyncHandler } = require('../middleware/errorHandler');
const { 
  getCustomerRFMAnalysis, 
  getSegmentOverview,
  calculateAllCustomersRFM 
} = require('../services/rfmService');
const { 
  getCustomerCLVAnalysis, 
  getTopCustomersByCLV 
} = require('../services/clvService');
const { 
  getCustomerChurnAnalysis, 
  getHighRiskCustomers,
  getPreventionStrategyDetails
} = require('../services/churnService');
const {
  generatePersonalizedRecommendations,
  getProductCrossSell
} = require('../services/recommendationService');
const { runAllAnalyticsNow } = require('../services/scheduledJobs');
const { CustomerAnalytics, Customer } = require('../models');

/**
 * GET /api/analytics/customer/:id/complete
 * Get complete analytics for a customer (RFM, CLV, Churn)
 */
const getCustomerCompleteAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get all analytics in parallel
  const [rfmData, clvData, churnData, recommendations] = await Promise.all([
    getCustomerRFMAnalysis(id),
    getCustomerCLVAnalysis(id),
    getCustomerChurnAnalysis(id),
    generatePersonalizedRecommendations(id, 5)
  ]);

  res.status(200).json({
    success: true,
    data: {
      customer_id: parseInt(id),
      rfm: rfmData,
      clv: clvData,
      churn: churnData,
      recommendations: recommendations
    }
  });
});

/**
 * GET /api/analytics/customer/:id/rfm
 * Get RFM analysis for a customer
 */
const getCustomerRFM = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const rfmData = await getCustomerRFMAnalysis(id);
  
  res.status(200).json({
    success: true,
    data: rfmData
  });
});

/**
 * GET /api/analytics/customer/:id/clv
 * Get CLV prediction for a customer
 */
const getCustomerCLV = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const clvData = await getCustomerCLVAnalysis(id);
  
  res.status(200).json({
    success: true,
    data: clvData
  });
});

/**
 * GET /api/analytics/customer/:id/churn
 * Get churn risk analysis for a customer
 */
const getCustomerChurn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const churnData = await getCustomerChurnAnalysis(id);
  
  res.status(200).json({
    success: true,
    data: churnData
  });
});

/**
 * GET /api/analytics/segments/overview
 * Get segment overview statistics
 */
const getSegments = asyncHandler(async (req, res) => {
  let overview = await getSegmentOverview();

  // 🧩 FIX: if overview is a JSON string, parse it
  if (typeof overview === 'string') {
    try {
      overview = JSON.parse(overview);
    } catch (err) {
      console.error('Failed to parse overview JSON:', err);
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON format in segment overview'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: overview
  });
});

/**
 * GET /api/analytics/customers/top-clv
 * Get customers with highest predicted CLV
 */
const getTopCLVCustomers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  let topCustomers = await getTopCustomersByCLV(parseInt(limit));

  // 🧩 If it's a string, parse it before sending
  if (typeof topCustomers === 'string') {
    try {
      topCustomers = JSON.parse(topCustomers);
    } catch (err) {
      console.error('Failed to parse topCustomers JSON:', err);
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON format in CLV data'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: topCustomers
  });
});


/**
 * GET /api/analytics/customers/high-risk
 * Get customers at high risk of churning
 */
const getHighRisk = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  
  const highRiskCustomers = await getHighRiskCustomers(parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: highRiskCustomers
  });
});

/**
 * GET /api/recommendations/:customerId
 * Get personalized recommendations for a customer
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { limit = 5 } = req.query;
  
  const recommendations = await generatePersonalizedRecommendations(
    parseInt(customerId),
    parseInt(limit)
  );
  
  res.status(200).json({
    success: true,
    data: recommendations
  });
});

/**
 * GET /api/recommendations/product/:productId/cross-sell
 * Get cross-sell recommendations for a product
 */
const getProductCrossSellRecommendations = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { limit = 5 } = req.query;
  
  const crossSell = await getProductCrossSell(parseInt(productId), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: crossSell
  });
});

/**
 * POST /api/analytics/calculate-all
 * Manually trigger analytics calculation for all customers
 */
const calculateAllAnalytics = asyncHandler(async (req, res) => {
  const result = await runAllAnalyticsNow();
  
  res.status(200).json({
    success: true,
    message: 'Analytics calculation started',
    data: result
  });
});

/**
 * GET /api/analytics/dashboard
 * Get overview dashboard data
 */
const getDashboardOverview = asyncHandler(async (req, res) => {
  const [
    segmentOverview,
    topCLVCustomers,
    highRiskCustomers,
    totalCustomers
  ] = await Promise.all([
    getSegmentOverview(),
    getTopCustomersByCLV(5),
    getHighRiskCustomers(5),
    Customer.count()
  ]);

  // Calculate aggregate metrics
  const analytics = await CustomerAnalytics.findAll({
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').col('rfm_score')), 'avg_rfm'],
      [require('sequelize').fn('AVG', require('sequelize').col('clv_predicted')), 'avg_clv'],
      [require('sequelize').fn('AVG', require('sequelize').col('churn_risk_score')), 'avg_churn'],
      [require('sequelize').fn('SUM', require('sequelize').col('clv_predicted')), 'total_predicted_value']
    ],
    raw: true
  });

  res.status(200).json({
    success: true,
    data: {
      total_customers: totalCustomers,
      // FIX: Don't nest segments - use the overview directly
      segments: segmentOverview.segments,  // ← Changed this line
      segment_total: segmentOverview.total_customers,  // ← Added this
      top_clv_customers: topCLVCustomers,
      high_risk_customers: highRiskCustomers,
      metrics: {
        avg_rfm_score: parseFloat(analytics[0].avg_rfm || 0).toFixed(2),
        avg_clv: parseFloat(analytics[0].avg_clv || 0).toFixed(2),
        avg_churn_risk: parseFloat(analytics[0].avg_churn || 0).toFixed(2),
        total_predicted_value: parseFloat(analytics[0].total_predicted_value || 0).toFixed(2)
      }
    }
  });
});

module.exports = {
  getCustomerCompleteAnalytics,
  getCustomerRFM,
  getCustomerCLV,
  getCustomerChurn,
  getSegments,
  getTopCLVCustomers,
  getHighRisk,
  getRecommendations,
  getProductCrossSellRecommendations,
  calculateAllAnalytics,
  getDashboardOverview
};