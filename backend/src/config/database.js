/**
 * Database Configuration
 * Sequelize ORM setup for MySQL connection
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'techmart_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    
    // Connection pool configuration
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // Logging
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // Timezone
    timezone: '+00:00',
    
    // Define options
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    
    // Increase max_allowed_packet on connection
    dialectOptions: {
      // Increase timeout and packet size
      connectTimeout: 60000
    }
  }
);

// Hook to run after connection is established
sequelize.beforeConnect(async (config) => {
  // This will be executed before each connection
});

// Increase max_allowed_packet after connection
sequelize.afterConnect(async (connection) => {
  try {
    // Increase max_allowed_packet to 64MB for this session
    await connection.query('SET GLOBAL max_allowed_packet=67108864;');
  } catch (error) {
    // Ignore error if user doesn't have SUPER privilege
    // The batch insert will still work
  }
});

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Try to increase max_allowed_packet
    try {
      await sequelize.query('SET GLOBAL max_allowed_packet=67108864;');
      console.log('✅ Increased max_allowed_packet to 64MB');
    } catch (error) {
      // Not critical, batch inserts will handle it
      console.log('ℹ️  Using default max_allowed_packet (batch inserts enabled)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
}

/**
 * Sync database models
 * @param {boolean} force - Drop tables if they exist
 */
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Database synchronized ${force ? '(force)' : ''}`);
  } catch (error) {
    console.error('❌ Database synchronization failed:', error.message);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};