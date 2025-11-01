/**
 * Setup Verification Script
 * Verifies that all components are properly configured
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');
const { Supplier, Product, Customer, Transaction } = require('./models');

/**
 * Check if .env file exists
 */
function checkEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    console.log('   Please copy .env.example to .env and configure your settings');
    return false;
  }
  console.log('✅ .env file exists');
  return true;
}

/**
 * Check required environment variables
 */
function checkEnvVariables() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:', missing.join(', '));
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}

/**
 * Check database connection
 */
async function checkDatabase() {
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Database connection failed');
    return false;
  }
  console.log('✅ Database connection successful');
  return true;
}

/**
 * Check if tables exist
 */
async function checkTables() {
  try {
    const supplierCount = await Supplier.count();
    const productCount = await Product.count();
    const customerCount = await Customer.count();
    const transactionCount = await Transaction.count();
    
    console.log('✅ Database tables verified:');
    console.log(`   - Suppliers: ${supplierCount} records`);
    console.log(`   - Products: ${productCount} records`);
    console.log(`   - Customers: ${customerCount} records`);
    console.log(`   - Transactions: ${transactionCount} records`);
    
    return true;
  } catch (error) {
    console.log('❌ Database tables not found or empty');
    console.log('   Please run: npm run migrate && npm run seed');
    return false;
  }
}

/**
 * Check CSV data files
 */
function checkCSVFiles() {
  const dataDir = path.join(__dirname, '../data');
  const files = ['suppliers.csv', 'products.csv', 'customers.csv', 'transactions.csv'];
  const missing = [];
  
  files.forEach(file => {
    if (!fs.existsSync(path.join(dataDir, file))) {
      missing.push(file);
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing CSV files:', missing.join(', '));
    console.log('   Please run: npm run generate-data');
    return false;
  }
  
  console.log('✅ All CSV data files exist');
  return true;
}

/**
 * Main verification function
 */
async function verify() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║                                               ║');
  console.log('║       TechMart Setup Verification            ║');
  console.log('║                                               ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  let allChecks = true;

  // Check .env file
  console.log('1. Checking .env configuration...');
  if (!checkEnvFile()) allChecks = false;
  
  // Check environment variables
  console.log('\n2. Checking environment variables...');
  if (!checkEnvVariables()) allChecks = false;
  
  // Check database connection
  console.log('\n3. Checking database connection...');
  if (!await checkDatabase()) {
    allChecks = false;
  } else {
    // Check tables only if database is connected
    console.log('\n4. Checking database tables...');
    if (!await checkTables()) allChecks = false;
  }
  
  // Check CSV files
  console.log('\n5. Checking CSV data files...');
  if (!checkCSVFiles()) allChecks = false;

  // Summary
  console.log('\n╔═══════════════════════════════════════════════╗');
  if (allChecks) {
    console.log('║                                               ║');
    console.log('║        ✅ All checks passed!                  ║');
    console.log('║        Ready to start the server              ║');
    console.log('║                                               ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    console.log('Run: npm start\n');
  } else {
    console.log('║                                               ║');
    console.log('║        ❌ Some checks failed                  ║');
    console.log('║        Please fix the issues above            ║');
    console.log('║                                               ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    console.log('Setup steps:');
    console.log('1. npm install');
    console.log('2. cp .env.example .env (then edit .env)');
    console.log('3. npm run generate-data');
    console.log('4. npm run migrate');
    console.log('5. npm run seed');
    console.log('6. npm start\n');
  }

  await sequelize.close();
  process.exit(allChecks ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  verify();
}

module.exports = verify;