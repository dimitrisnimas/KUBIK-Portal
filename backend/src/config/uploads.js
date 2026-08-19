const fs = require('fs');
const os = require('os');
const path = require('path');
const { getWorkspaceSchema, isWorkspaceSchema } = require('./request-context');

const uploadsRoot = path.join(os.tmpdir(), 'kubik-portal-demo', 'uploads');

function getUploadDirectory(name) {
  const workspaceSchema = getWorkspaceSchema();
  if (!isWorkspaceSchema(workspaceSchema)) {
    throw new Error('An authenticated demo workspace is required for uploads');
  }
  const directory = path.join(uploadsRoot, workspaceSchema, name);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function removeWorkspaceUploads(schemaName) {
  if (!isWorkspaceSchema(schemaName)) return;
  fs.rmSync(path.join(uploadsRoot, schemaName), { recursive: true, force: true });
}

module.exports = {
  getUploadDirectory,
  removeWorkspaceUploads,
};
