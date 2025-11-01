/**
 * TechMart Backend Server
 * Main Express application entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
// Import configuration and middleware
const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

// NEW: Import scheduled jobs
const { initializeScheduledJobs, runAllAnalyticsNow } = require('./services/scheduledJobs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const swaggerDocument = require('./swagger.json');


/**
 * CORS Configuration
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Body Parsing Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Logging Middleware (simple console logging)
 */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
/**
 * Root Route
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to TechMart API',
    version: '1.0.0',
    documentation: '/api',
    endpoints: {
      dashboard: '/api/dashboard/overview',
      transactions: '/api/transactions',
      inventory: '/api/inventory/low-stock',
      analytics: '/api/analytics/hourly-sales',
      alerts: '/api/alerts'
    }
  });
});

/**
 * Health Check Route
 */
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();

  res.status(dbStatus ? 200 : 503).json({
    success: true,
    message: 'TechMart API Health Check',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus ? 'connected' : 'disconnected'
  });
});

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * 404 Handler
 */
app.use(notFoundHandler);

/**
 * Error Handler
 * Must be last middleware
 */
app.use(errorHandler);

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      console.error('Please ensure MySQL is running and credentials are correct in .env file');
      console.log('\nTo fix this:');
      console.log('1. Copy .env.example to .env');
      console.log('2. Update database credentials in .env');
      console.log('3. Ensure MySQL server is running');
      process.exit(1);
    }

    // Start Express server
    app.listen(PORT, async () => {
      console.log('\n╔═══════════════════════════════════════════════╗');
      console.log('║                                               ║');
      console.log('║         🚀 TechMart API Server Running        ║');
      console.log('║                                               ║');
      console.log('╚═══════════════════════════════════════════════╝\n');
      console.log(`📍 Server URL:     http://localhost:${PORT}`);
      console.log(`📍 API Base:       http://localhost:${PORT}/api`);
      console.log(`📍 Health Check:   http://localhost:${PORT}/health`);
      console.log(`📍 Environment:    ${process.env.NODE_ENV || 'development'}\n`);
      console.log('📋 Available Endpoints:');
      console.log(`   • Dashboard:     GET  /api/dashboard/overview`);
      console.log(`   • Transactions:  POST /api/transactions`);
      console.log(`   • Suspicious:    GET  /api/transactions/suspicious`);
      console.log(`   • Low Stock:     GET  /api/inventory/low-stock`);
      console.log(`   • Analytics:     GET  /api/analytics/hourly-sales`);
      console.log(`   • Alerts:        POST /api/alerts\n`);
      console.log('Press Ctrl+C to stop the server\n');

      // ============================
      // 🔄 NEW: Initialize Analytics System
      // ============================
      console.log('⏰ Initializing analytics system...');
      initializeScheduledJobs();

      // Optional: Run initial analytics calculation at startup
      if (process.env.RUN_INITIAL_ANALYTICS === 'true') {
        console.log('\n🔄 Running initial analytics calculation...');
        setTimeout(async () => {
          try {
            await runAllAnalyticsNow();
            console.log('✅ Initial analytics complete!');
          } catch (error) {
            console.error('❌ Error in initial analytics:', error);
          }
        }, 5000); // Wait 5 seconds after server start
      }

      console.log('\n✅ System ready!\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing server gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
