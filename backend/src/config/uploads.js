const fs = require('fs');
const os = require('os');
const path = require('path');

const uploadsRoot = path.join(os.tmpdir(), 'kubik-portal-demo', 'uploads');

function getUploadDirectory(name) {
  const directory = path.join(uploadsRoot, name);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

module.exports = {
  uploadsRoot,
  getUploadDirectory,
};
