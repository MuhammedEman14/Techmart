/**
 * Database Cleanup Script
 * Safely drops all tables in the correct order
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const { Supplier, Product, Customer, Transaction } = require('../models');

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    console.log('🗑️  Dropping all tables...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('   ⚙️  Foreign key checks disabled');

    // Drop tables in reverse dependency order
    try {
      await Transaction.drop();
      console.log('   ✓ Transactions table dropped');
    } catch (err) {
      console.log('   ⚠️  Transactions table not found (skipping)');
    }

    try {
      await Product.drop();
      console.log('   ✓ Products table dropped');
    } catch (err) {
      console.log('   ⚠️  Products table not found (skipping)');
    }

    try {
      await Customer.drop();
      console.log('   ✓ Customers table dropped');
    } catch (err) {
      console.log('   ⚠️  Customers table not found (skipping)');
    }

    try {
      await Supplier.drop();
      console.log('   ✓ Suppliers table dropped');
    } catch (err) {
      console.log('   ⚠️  Suppliers table not found (skipping)');
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('   ⚙️  Foreign key checks re-enabled');

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('💡 Run "npm run migrate" to recreate tables\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanDatabase();
}

module.exports = cleanDatabase;