const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const [admins] = await db.execute(
      'SELECT role FROM portal_admins WHERE user_id = ?',
      [req.user.id]
    );

    const adminRole = admins.length > 0 ? admins[0].role : null;

    res.json({
      user: {
        id: req.user.id,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        email: req.user.email,
        status: req.user.status,
        wallet_balance: req.user.wallet_balance,
        admin_role: adminRole
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', requireAuth, [
  body('first_name').trim().isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('last_name').trim().isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name } = req.body;
    req.session.profile = { firstName: first_name, lastName: last_name };
    req.session.save((error) => {
      if (error) {
        console.error('Profile session save error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      return res.json({ message: 'Profile updated for this demo session' });
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user assets
router.get('/assets', requireAuth, async (req, res) => {
  try {
    const [assets] = await db.execute(`
      SELECT a.*, p.name as package_name, p.price as package_price
      FROM assets a
      LEFT JOIN packages p ON a.package_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    res.json(assets);
  } catch (error) {
    console.error('Get user assets error:', error);
    res.status(500).json({ error: 'Failed to get assets' });
  }
});

// Get user tickets
router.get('/tickets', requireAuth, async (req, res) => {
  try {
    const [tickets] = await db.execute(`
      SELECT t.*, a.name as asset_name
      FROM tickets t
      LEFT JOIN assets a ON t.asset_id = a.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    res.json(tickets);
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Get user invoices
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    const [invoices] = await db.execute(`
      SELECT i.*, a.name as asset_name
      FROM invoices i
      LEFT JOIN assets a ON i.asset_id = a.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `, [req.user.id]);

    res.json(invoices);
  } catch (error) {
    console.error('Get user invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

module.exports = router;
