const crypto = require('crypto');
const db = require('../config/database');
const { isWorkspaceSchema } = require('../config/request-context');
const { SESSION_TTL_SECONDS } = require('../config/session');
const { removeWorkspaceUploads } = require('../config/uploads');

const WORKSPACE_TABLES = [
  'users',
  'portal_admins',
  'categories',
  'packages',
  'assets',
  'asset_collaborators',
  'invoices',
  'tickets',
  'ticket_messages',
  'ticket_attachments',
  'pricing_config',
  'system_settings',
  'email_templates',
  'email_queue',
  'admin_activity_logs',
];

const WORKSPACE_FOREIGN_KEYS = [
  'ALTER TABLE %SCHEMA%."portal_admins" ADD FOREIGN KEY (user_id) REFERENCES %SCHEMA%."users"(id) ON DELETE CASCADE',
  'ALTER TABLE %SCHEMA%."packages" ADD FOREIGN KEY (category_id) REFERENCES %SCHEMA%."categories"(id) ON DELETE SET NULL',
  'ALTER TABLE %SCHEMA%."assets" ADD FOREIGN KEY (user_id) REFERENCES %SCHEMA%."users"(id) ON DELETE CASCADE',
  'ALTER TABLE %SCHEMA%."assets" ADD FOREIGN KEY (package_id) REFERENCES %SCHEMA%."packages"(id) ON DELETE SET NULL',
  'ALTER TABLE %SCHEMA%."asset_collaborators" ADD FOREIGN KEY (asset_id) REFERENCES %SCHEMA%."assets"(id) ON DELETE CASCADE',
  'ALTER TABLE %SCHEMA%."asset_collaborators" ADD FOREIGN KEY (user_id) REFERENCES %SCHEMA%."users"(id) ON DELETE CASCADE',
  'ALTER TABLE %SCHEMA%."invoices" ADD FOREIGN KEY (user_id) REFERENCES %SCHEMA%."users"(id) ON DELETE CASCADE',
  'ALTER TABLE %SCHEMA%."invoices" ADD FOREIGN KEY (asset_id) REFERENCES %SCHEMA%."assets"(id) ON DELETE SET NULL',
  'ALTER TABLE %SCHEMA%."invoices" ADD FOREIGN KEY (uploaded_by) REFERENCES %SCHEMA%."users"(id) ON DELETE SET NULL',
  'ALTER TABLE %SCHEMA%."tickets" ADD FOREIGN KEY (user_id) REFERENCES %SCHEMA%."users"(id) ON DELETE CASCADE',
  'ALTER TABLE %SCHEMA%."tickets" ADD FOREIGN KEY (asset_id) REFERENCES %SCHEMA%."assets"(id) ON DELETE SET NULL',
  'ALTER TABLE %SCHEMA%."ticket_messages" ADD FOREIGN KEY (ticket_id) REFERENCES %SCHEMA%."tickets"(id) ON DELETE CASCADE',
  'ALTER TABLE %SCHEMA%."ticket_attachments" ADD FOREIGN KEY (ticket_message_id) REFERENCES %SCHEMA%."ticket_messages"(id) ON DELETE CASCADE',
  'ALTER TABLE %SCHEMA%."system_settings" ADD FOREIGN KEY (updated_by) REFERENCES %SCHEMA%."users"(id) ON DELETE SET NULL',
  'ALTER TABLE %SCHEMA%."admin_activity_logs" ADD FOREIGN KEY (admin_id) REFERENCES %SCHEMA%."portal_admins"(id) ON DELETE SET NULL',
];

function quoteWorkspaceSchema(schemaName) {
  if (!isWorkspaceSchema(schemaName)) throw new Error('Invalid demo workspace schema');
  return `"${schemaName}"`;
}

function workspaceExpiry() {
  return new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
}

async function createWorkspace({ email, role, personaId }) {
  const schemaName = `demo_${crypto.randomBytes(16).toString('hex')}`;
  const quotedSchema = quoteWorkspaceSchema(schemaName);
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA ${quotedSchema}`);

    for (const table of WORKSPACE_TABLES) {
      await client.query(`CREATE TABLE ${quotedSchema}."${table}" (LIKE public."${table}" INCLUDING ALL)`);
      await client.query(`INSERT INTO ${quotedSchema}."${table}" SELECT * FROM public."${table}"`);
    }

    await client.query(`
      CREATE VIEW ${quotedSchema}.service_packages AS
      SELECT id, name, description, price, currency, billing_cycle, features,
             is_active, created_at
      FROM ${quotedSchema}.packages
    `);

    for (const foreignKey of WORKSPACE_FOREIGN_KEYS) {
      await client.query(foreignKey.replaceAll('%SCHEMA%', quotedSchema));
    }

    if (Number.isInteger(Number(personaId))) {
      await client.query(
        `UPDATE ${quotedSchema}.users SET last_login = NOW() WHERE id = $1`,
        [personaId],
      );
    }

    const expiresAt = workspaceExpiry();
    await client.query(`
      INSERT INTO public.demo_workspaces
        (schema_name, verified_email, demo_role, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [schemaName, email, role, expiresAt]);
    await client.query('COMMIT');
    return { schemaName, expiresAt };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function touchWorkspace(schemaName) {
  if (!isWorkspaceSchema(schemaName)) return null;
  const expiresAt = workspaceExpiry();
  const result = await db.pool.query(`
    UPDATE public.demo_workspaces
    SET expires_at = $2
    WHERE schema_name = $1 AND expires_at > NOW()
    RETURNING schema_name
  `, [schemaName, expiresAt]);
  return result.rowCount > 0 ? expiresAt : null;
}

async function destroyWorkspace(schemaName) {
  if (!isWorkspaceSchema(schemaName)) return;
  const quotedSchema = quoteWorkspaceSchema(schemaName);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`);
    await client.query(
      'DELETE FROM public.demo_workspaces WHERE schema_name = $1',
      [schemaName],
    );
    await client.query('COMMIT');
    try {
      removeWorkspaceUploads(schemaName);
    } catch (error) {
      console.error('Unable to remove temporary workspace uploads:', error.message);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function cleanupExpiredWorkspaces() {
  const result = await db.pool.query(`
    SELECT schema_name
    FROM public.demo_workspaces
    WHERE expires_at <= NOW()
    ORDER BY expires_at
    LIMIT 25
  `);

  for (const workspace of result.rows) {
    await destroyWorkspace(workspace.schema_name);
  }

  return result.rowCount;
}

module.exports = {
  cleanupExpiredWorkspaces,
  createWorkspace,
  destroyWorkspace,
  touchWorkspace,
};
