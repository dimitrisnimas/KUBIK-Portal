const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kubikportal',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Export the pool for direct use
module.exports = pool;

// Also export configuration objects for session store
module.exports.connection = dbConfig;
module.exports.session = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kubikportal',
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 min
  expiration: 86400000, // 1 day
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data',
    },
  },
}; 