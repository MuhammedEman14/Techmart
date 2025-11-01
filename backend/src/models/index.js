/**
 * Models Index
 * Initialize all models and define associations
 */

const { sequelize } = require('../config/database');
const Sequelize = require('sequelize');

// Initialize db object
const db = {};

// Add Sequelize instances
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load existing models
db.Supplier = require('./Supplier');
db.Product = require('./Product');
db.Customer = require('./Customer');
db.Transaction = require('./Transaction');

// Load new analytics models
db.CustomerAnalytics = require('./CustomerAnalytics')(sequelize);
db.ProductRecommendation = require('./ProductRecommendation')(sequelize);
db.AnalyticsCache = require('./AnalyticsCache')(sequelize);
db.ABTest = require('./ABTest')(sequelize);

/**
 * Define Associations for OLD models only
 * (New models handle associations in their own files)
 */

// Supplier - Product relationship
db.Supplier.hasMany(db.Product, {
  foreignKey: 'supplier_id',
  as: 'products'
});

db.Product.belongsTo(db.Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier'
});

// Customer - Transaction relationship
db.Customer.hasMany(db.Transaction, {
  foreignKey: 'customer_id',
  as: 'transactions'
});

db.Transaction.belongsTo(db.Customer, {
  foreignKey: 'customer_id',
  as: 'customer'
});

// Product - Transaction relationship
db.Product.hasMany(db.Transaction, {
  foreignKey: 'product_id',
  as: 'transactions'
});

db.Transaction.belongsTo(db.Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// Call associate methods for new models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;