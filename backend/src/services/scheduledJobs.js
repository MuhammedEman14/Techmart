/**
 * Scheduled Jobs for Analytics
 * Runs analytics calculations periodically
 */

const cron = require('node-cron');
const { calculateAllCustomersRFM } = require('./rfmService');
const { calculateAllCustomersCLV } = require('./clvService');
const { calculateAllCustomersChurnRisk } = require('./churnService');
const { generateAllRecommendations } = require('./recommendationService');
const cacheService = require('./cacheService'); // NEW

/**
 * Initialize all scheduled jobs
 */
function initializeScheduledJobs() {
  console.log('⏰ Initializing scheduled analytics jobs...');

  // Run RFM analysis every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Running scheduled RFM analysis...');
    try {
      await calculateAllCustomersRFM();
      console.log('✅ Scheduled RFM analysis complete');
    } catch (error) {
      console.error('❌ Error in scheduled RFM analysis:', error);
    }
  });

  // Run CLV prediction every 24 hours (midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running scheduled CLV prediction...');
    try {
      await calculateAllCustomersCLV();
      console.log('✅ Scheduled CLV prediction complete');
    } catch (error) {
      console.error('❌ Error in scheduled CLV prediction:', error);
    }
  });

  // Run churn risk analysis every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('🔄 Running scheduled churn risk analysis...');
    try {
      await calculateAllCustomersChurnRisk();
      console.log('✅ Scheduled churn risk analysis complete');
    } catch (error) {
      console.error('❌ Error in scheduled churn risk analysis:', error);
    }
  });

  // Run recommendation generation every 24 hours (2 AM)
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Running scheduled recommendation generation...');
    try {
      await generateAllRecommendations();
      console.log('✅ Scheduled recommendation generation complete');
    } catch (error) {
      console.error('❌ Error in scheduled recommendation generation:', error);
    }
  });

  // NEW: Clean expired cache every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Cleaning expired cache entries...');
    try {
      const count = await cacheService.cleanExpired();
      console.log(`✅ Cleaned ${count} expired cache entries`);
    } catch (error) {
      console.error('❌ Error cleaning cache:', error);
    }
  });

  console.log('✅ All scheduled jobs initialized');
}

/**
 * Run all analytics immediately (manual trigger)
 */
async function runAllAnalyticsNow() {
  console.log('🚀 Running all analytics immediately...');
  
  try {
    console.log('1/4 Running RFM analysis...');
    await calculateAllCustomersRFM();
    
    console.log('2/4 Running CLV prediction...');
    await calculateAllCustomersCLV();
    
    console.log('3/4 Running churn risk analysis...');
    await calculateAllCustomersChurnRisk();
    
    console.log('4/4 Generating recommendations...');
    await generateAllRecommendations();
    
    console.log('✅ All analytics complete!');
    
    return {
      success: true,
      message: 'All analytics calculations completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error running analytics:', error);
    throw error;
  }
}

module.exports = {
  initializeScheduledJobs,
  runAllAnalyticsNow
};
