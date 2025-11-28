const express = require('express');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Public system settings endpoint (no auth)
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await db.execute('SELECT setting_key, setting_value, setting_type FROM system_settings');
    res.json({ settings });
  } catch (error) {
    console.error('System settings error:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

// Placeholder route
router.get('/', (req, res) => {
  res.json({ message: 'System route placeholder' });
});

module.exports = router; 