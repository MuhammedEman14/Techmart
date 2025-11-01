require('dotenv').config();
const { sequelize } = require('../config/database');
const { 
  Supplier, 
  Product, 
  Customer, 
  Transaction,
  // ADD THESE NEW MODELS:
  CustomerAnalytics,
  ProductRecommendation,
  AnalyticsCache,
  ABTest
} = require('../models');

async function runMigrations() {
  try {
    console.log('🚀 Starting database migration...\n');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Drop in reverse order (add new tables)
    await Transaction.drop({ cascade: true }).catch(() => {});
    await ABTest.drop({ cascade: true }).catch(() => {}); // NEW
    await AnalyticsCache.drop({ cascade: true }).catch(() => {}); // NEW
    await ProductRecommendation.drop({ cascade: true }).catch(() => {}); // NEW
    await CustomerAnalytics.drop({ cascade: true }).catch(() => {}); // NEW
    await Product.drop({ cascade: true }).catch(() => {});
    await Customer.drop({ cascade: true }).catch(() => {});
    await Supplier.drop({ cascade: true }).catch(() => {});
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Create in correct order
    await Supplier.sync({ force: false });
    console.log('   ✓ Suppliers table created');
    
    await Customer.sync({ force: false });
    console.log('   ✓ Customers table created');
    
    await Product.sync({ force: false });
    console.log('   ✓ Products table created');
    
    await Transaction.sync({ force: false });
    console.log('   ✓ Transactions table created');

    // NEW ANALYTICS TABLES
    await CustomerAnalytics.sync({ force: false });
    console.log('   ✓ CustomerAnalytics table created');
    
    await ProductRecommendation.sync({ force: false });
    console.log('   ✓ ProductRecommendation table created');
    
    await AnalyticsCache.sync({ force: false });
    console.log('   ✓ AnalyticsCache table created');
    
    await ABTest.sync({ force: false });
    console.log('   ✓ ABTest table created');

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;