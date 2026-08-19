const { AsyncLocalStorage } = require('async_hooks');

const requestContext = new AsyncLocalStorage();
const WORKSPACE_SCHEMA_PATTERN = /^demo_[a-f0-9]{32}$/;

function getWorkspaceSchema() {
  return requestContext.getStore()?.workspaceSchema || null;
}

function isWorkspaceSchema(value) {
  return typeof value === 'string' && WORKSPACE_SCHEMA_PATTERN.test(value);
}

module.exports = {
  requestContext,
  getWorkspaceSchema,
  isWorkspaceSchema,
};
