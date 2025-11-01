/**
 * A/B Testing Controller
 * Handles A/B testing endpoints
 */

const { asyncHandler } = require('../middleware/errorHandler');
const {
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
} = require('../services/abTestService');

/**
 * POST /api/ab-tests
 * Create a new A/B test
 */
const create = asyncHandler(async (req, res) => {
  const testConfig = req.body;
  
  const result = await createABTest(testConfig);
  
  res.status(201).json({
    success: true,
    message: 'A/B test created successfully',
    data: result.test
  });
});

/**
 * GET /api/ab-tests
 * Get all active A/B tests
 */
const getAll = asyncHandler(async (req, res) => {
  const tests = await getActiveTests();
  
  res.status(200).json({
    success: true,
    data: tests
  });
});

/**
 * GET /api/ab-tests/:id
 * Get A/B test by ID
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const test = await getTestById(parseInt(id));
  
  res.status(200).json({
    success: true,
    data: test
  });
});

/**
 * GET /api/ab-tests/:id/results
 * Get test results with analysis
 */
const getResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const results = await getTestResults(parseInt(id));
  
  res.status(200).json({
    success: true,
    data: results
  });
});

/**
 * POST /api/ab-tests/:id/assign/:customerId
 * Assign customer to test variant
 */
const assignCustomer = asyncHandler(async (req, res) => {
  const { id, customerId } = req.params;
  
  const variant = await assignCustomerToVariant(parseInt(id), parseInt(customerId));
  
  res.status(200).json({
    success: true,
    data: {
      test_id: parseInt(id),
      customer_id: parseInt(customerId),
      assigned_variant: variant
    }
  });
});

/**
 * POST /api/ab-tests/:id/conversion
 * Track conversion for a customer
 */
const recordConversion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customer_id, revenue = 0 } = req.body;
  
  const result = await trackConversion(parseInt(id), parseInt(customer_id), parseFloat(revenue));
  
  res.status(200).json({
    success: true,
    message: 'Conversion tracked successfully',
    data: result
  });
});

/**
 * POST /api/ab-tests/:id/engagement
 * Track engagement for a customer
 */
const recordEngagement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customer_id, engagement_score } = req.body;
  
  const result = await trackEngagement(
    parseInt(id),
    parseInt(customer_id),
    parseFloat(engagement_score)
  );
  
  res.status(200).json({
    success: true,
    message: 'Engagement tracked successfully',
    data: result
  });
});

/**
 * POST /api/ab-tests/:id/complete
 * Complete an A/B test
 */
const complete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await completeTest(parseInt(id));
  
  res.status(200).json({
    success: true,
    message: 'Test completed successfully',
    data: result.results
  });
});

/**
 * POST /api/ab-tests/:id/pause
 * Pause an A/B test
 */
const pause = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await pauseTest(parseInt(id));
  
  res.status(200).json({
    success: true,
    message: 'Test paused successfully'
  });
});

/**
 * POST /api/ab-tests/:id/resume
 * Resume a paused A/B test
 */
const resume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await resumeTest(parseInt(id));
  
  res.status(200).json({
    success: true,
    message: 'Test resumed successfully'
  });
});

module.exports = {
  create,
  getAll,
  getById,
  getResults,
  assignCustomer,
  recordConversion,
  recordEngagement,
  complete,
  pause,
  resume
};