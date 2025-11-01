/**
 * Database Seeder Script
 * Imports data from CSV files into the database
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize } = require('../config/database');
const { Supplier, Product, Customer, Transaction } = require('../models');

/**
 * Read CSV file and return array of objects
 */
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Import suppliers from CSV
 */
async function seedSuppliers() {
  try {
    const filePath = path.join(__dirname, '../../data/suppliers.csv');
    
    if (!fs.existsSync(filePath)) {
      console.log('⚠️  suppliers.csv not found, skipping...');
      return 0;
    }

    const data = await readCSV(filePath);
    
    // Bulk create suppliers
    await Supplier.bulkCreate(data, { ignoreDuplicates: true });
    
    console.log(`   ✓ Imported ${data.length} suppliers`);
    return data.length;
  } catch (error) {
    console.error('   ✗ Error importing suppliers:', error.message);
    throw error;
  }
}

/**
 * Import customers from CSV
 */
async function seedCustomers() {
  try {
    const filePath = path.join(__dirname, '../../data/customers.csv');
    
    if (!fs.existsSync(filePath)) {
      console.log('⚠️  customers.csv not found, skipping...');
      return 0;
    }

    const data = await readCSV(filePath);
    
    // Insert in batches to avoid max_allowed_packet error
    const batchSize = 500; // Insert 500 customers at a time
    let totalImported = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await Customer.bulkCreate(batch, { 
        ignoreDuplicates: true,
        validate: false
      });
      totalImported += batch.length;
      
      // Show progress for large datasets
      if (data.length > 100) {
        const progress = Math.round((totalImported / data.length) * 100);
        process.stdout.write(`\r   📊 Importing customers: ${progress}% (${totalImported}/${data.length})`);
      }
    }
    
    if (data.length > 100) {
      console.log(''); // New line after progress bar
    }
    console.log(`   ✓ Imported ${totalImported} customers`);
    return totalImported;
  } catch (error) {
    console.error('\n   ✗ Error importing customers:', error.message);
    throw error;
  }
}

/**
 * Import products from CSV
 */
async function seedProducts() {
  try {
    const filePath = path.join(__dirname, '../../data/products.csv');
    
    if (!fs.existsSync(filePath)) {
      console.log('⚠️  products.csv not found, skipping...');
      return 0;
    }

    const data = await readCSV(filePath);
    
    // Insert in batches to avoid max_allowed_packet error
    const batchSize = 250; // Insert 250 products at a time
    let totalImported = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await Product.bulkCreate(batch, { 
        ignoreDuplicates: true,
        validate: false
      });
      totalImported += batch.length;
      
      // Show progress for large datasets
      if (data.length > 100) {
        const progress = Math.round((totalImported / data.length) * 100);
        process.stdout.write(`\r   📊 Importing products: ${progress}% (${totalImported}/${data.length})`);
      }
    }
    
    if (data.length > 100) {
      console.log(''); // New line after progress bar
    }
    console.log(`   ✓ Imported ${totalImported} products`);
    return totalImported;
  } catch (error) {
    console.error('\n   ✗ Error importing products:', error.message);
    throw error;
  }
}

/**
 * Import transactions from CSV
 */
async function seedTransactions() {
  try {
    const filePath = path.join(__dirname, '../../data/transactions.csv');
    
    if (!fs.existsSync(filePath)) {
      console.log('⚠️  transactions.csv not found, skipping...');
      return 0;
    }

    const data = await readCSV(filePath);
    
    // Insert in batches to avoid max_allowed_packet error
    const batchSize = 500; // Insert 500 records at a time
    let totalImported = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await Transaction.bulkCreate(batch, { 
        ignoreDuplicates: true,
        validate: false // Skip validation for faster inserts
      });
      totalImported += batch.length;
      
      // Show progress
      const progress = Math.round((totalImported / data.length) * 100);
      process.stdout.write(`\r   📊 Importing transactions: ${progress}% (${totalImported}/${data.length})`);
    }
    
    console.log(`\n   ✓ Imported ${totalImported} transactions`);
    return totalImported;
  } catch (error) {
    console.error('\n   ✗ Error importing transactions:', error.message);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function runSeeders() {
  try {
    console.log('🚀 Starting database seeding...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    console.log('📥 Importing data from CSV files...\n');

    // Import data in order (respecting foreign key dependencies)
    await seedSuppliers();
    await seedCustomers();
    await seedProducts();
    await seedTransactions();

    console.log('\n✅ Seeding completed successfully!');
    console.log('📊 All data has been imported\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seeders if called directly
if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;