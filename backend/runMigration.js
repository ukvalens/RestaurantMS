require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  application_name: 'migration_script',
};

// Try without SSL first, then with SSL if that fails
const pool = new Pool(connectionOptions);

const migration = `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);`;

(async () => {
  let client;
  try {
    console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected successfully');
    console.log('Running migration: Add avatar_url column...');
    await client.query(migration);
    console.log('✅ Migration successful! avatar_url column added to users table.');
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    if (client) client.release();
    process.exit(1);
  }
})();
