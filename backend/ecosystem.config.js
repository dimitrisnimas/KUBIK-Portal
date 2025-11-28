module.exports = {
  apps: [
    {
      name: 'kubikportal-backend',
      script: './src/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      }
    }
  ]
}; 