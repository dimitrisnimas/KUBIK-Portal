const { Pool } = require('pg');
const { getWorkspaceSchema, isWorkspaceSchema } = require('./request-context');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString,
  max: Number(process.env.DATABASE_POOL_MAX || 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: 'kubik-portal-demo',
});

/**
 * Compatibility adapter for the existing route-level database contract.
 * It keeps the migration isolated while all persistence runs on PostgreSQL.
 */
async function execute(statement, values = []) {
  const sql = normalizeStatement(statement);
  const workspaceSchema = getWorkspaceSchema();
  let result;

  if (workspaceSchema) {
    if (!isWorkspaceSchema(workspaceSchema)) throw new Error('Invalid demo workspace context');
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${workspaceSchema}", pg_catalog`);
      result = await client.query(sql, values);
    } finally {
      await client.query('RESET search_path').catch(() => {});
      client.release();
    }
  } else {
    result = await pool.query(sql, values);
  }

  if (/^\s*(SELECT|WITH)\b/i.test(sql)) {
    return [result.rows, result.fields];
  }

  return [{
    affectedRows: result.rowCount,
    insertId: result.rows[0]?.id,
  }, result.fields];
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const workspaceSchema = getWorkspaceSchema();
    if (workspaceSchema) {
      if (!isWorkspaceSchema(workspaceSchema)) throw new Error('Invalid demo workspace context');
      await client.query(`SET LOCAL search_path TO "${workspaceSchema}", pg_catalog`);
    }
    const value = await callback({
      execute: async (statement, values = []) => {
        const sql = normalizeStatement(statement);
        const result = await client.query(sql, values);
        if (/^\s*(SELECT|WITH)\b/i.test(sql)) return [result.rows, result.fields];
        return [{ affectedRows: result.rowCount, insertId: result.rows[0]?.id }, result.fields];
      },
    });
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function normalizeStatement(statement) {
  let parameterIndex = 0;
  let sql = statement.replace(/\?/g, () => `$${++parameterIndex}`);

  if (/^\s*INSERT\s+INTO\b/i.test(sql) && !/\bRETURNING\b/i.test(sql)) {
    sql = `${sql.trim().replace(/;$/, '')} RETURNING id`;
  }

  return sql;
}

module.exports = {
  execute,
  transaction,
  pool,
  close: () => pool.end(),
};
