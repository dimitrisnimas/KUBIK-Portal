const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Client dashboard data
router.get('/data', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's stats
    const [stats] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM assets WHERE user_id = ?) as totalAssets,
        (SELECT COUNT(*) FROM assets WHERE user_id = ? AND status = 'active') as activeAssets,
        (SELECT COUNT(*) FROM invoices WHERE user_id = ?) as total_invoices,
        (SELECT COUNT(*) FROM invoices WHERE user_id = ? AND status = 'pending') as pending_invoices,
        (SELECT COUNT(*) FROM tickets WHERE user_id = ?) as totalTickets,
        (SELECT COUNT(*) FROM tickets WHERE user_id = ? AND status IN ('open', 'in_progress')) as openTickets,
        (SELECT IFNULL(SUM(total_amount), 0) FROM invoices WHERE user_id = ? AND status = 'paid') as total_paid,
        (SELECT IFNULL(SUM(total_amount), 0) FROM invoices WHERE user_id = ? AND status = 'pending') as monthlyExpenses
    `, [userId, userId, userId, userId, userId, userId, userId, userId]);

    // Get recent assets
    const [recentAssets] = await db.execute(`
      SELECT 
        a.id, a.name, a.category, a.status, a.created_at,
        p.name as package_name, p.price as package_price
      FROM assets a
      LEFT JOIN packages p ON a.package_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC LIMIT 5
    `, [userId]);

    // Get recent tickets
    const [recentTickets] = await db.execute(`
      SELECT *
      FROM tickets
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 5
    `, [userId]);

    // Get recent invoices
    const [recentInvoices] = await db.execute(`
      SELECT *
      FROM invoices
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 5
    `, [userId]);

    // Get user's services (assets with package details)
    const [myServices] = await db.execute(`
      SELECT 
        a.id, a.name, a.status, a.category,
        p.name as package_name, p.price as package_price, p.features as package_features,
        a.category as category_name
      FROM assets a
      LEFT JOIN packages p ON a.package_id = p.id
      WHERE a.user_id = ? AND a.status = 'active'
      ORDER BY a.created_at DESC
    `, [userId]);

    res.json({
      stats: stats[0],
      recentAssets,
      recentTickets,
      recentInvoices,
      myServices: myServices.map(service => ({
        ...service,
        package_features: service.package_features ? JSON.parse(service.package_features) : []
      }))
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
