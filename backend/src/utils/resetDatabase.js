const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  let connection;
  
  try {
    console.log('🔄 Resetting database...');
    
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('✅ Connected to MySQL');

    // Drop database if exists
    console.log(`🗑️  Dropping database ${process.env.DB_NAME} (if exists)...`);
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    
    // Create fresh database
    console.log(`📝 Creating database ${process.env.DB_NAME}...`);
    await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    
    console.log('✅ Database reset successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Run: npm run migrate');
    console.log('  2. Run: npm run seed');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;