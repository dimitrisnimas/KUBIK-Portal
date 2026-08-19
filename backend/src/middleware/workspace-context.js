const { requestContext, isWorkspaceSchema } = require('../config/request-context');
const { SESSION_TTL_SECONDS } = require('../config/session');
const { destroyWorkspace, touchWorkspace } = require('../services/demo-workspaces');

const REFRESH_AFTER_SECONDS = Math.min(15 * 60, Math.floor(SESSION_TTL_SECONDS / 2));

function destroySession(req) {
  return new Promise((resolve) => req.session.destroy(() => resolve()));
}

async function rejectExpiredWorkspace(req, res) {
  const schemaName = req.session.workspaceSchema;
  await destroyWorkspace(schemaName).catch((error) => {
    console.error('Unable to clean expired demo workspace:', error.message);
  });
  await destroySession(req);
  return res.status(401).json({ error: 'Demo session expired' });
}

async function workspaceContext(req, res, next) {
  const schemaName = req.session?.workspaceSchema;
  if (!schemaName) return requestContext.run({ workspaceSchema: null }, next);

  if (!isWorkspaceSchema(schemaName)) return rejectExpiredWorkspace(req, res);

  const expiresAt = new Date(req.session.workspaceExpiresAt || 0);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) {
    return rejectExpiredWorkspace(req, res);
  }

  const secondsRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  if (secondsRemaining <= SESSION_TTL_SECONDS - REFRESH_AFTER_SECONDS) {
    try {
      const refreshedExpiry = await touchWorkspace(schemaName);
      if (!refreshedExpiry) return rejectExpiredWorkspace(req, res);
      req.session.workspaceExpiresAt = refreshedExpiry.toISOString();
    } catch (error) {
      return next(error);
    }
  }

  return requestContext.run({ workspaceSchema: schemaName }, next);
}

module.exports = { workspaceContext };
