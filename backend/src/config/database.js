const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true,
  // SSL configuration for TiDB Cloud and other secure MySQL hosts
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com')
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : undefined,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Export the pool for direct use
module.exports = pool;

// Also export configuration objects for session store
module.exports.connection = dbConfig;
module.exports.session = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 min
  expiration: 86400000, // 1 day
  createDatabaseTable: true,
  // SSL configuration for TiDB Cloud
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com')
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : undefined,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data',
    },
  },
}; 
