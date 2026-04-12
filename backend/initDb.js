const pool = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
    
    await pool.query(schemaSQL);
    
    console.log('✅ Database tables created successfully!');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initDatabase();
