const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET / - List all available service packages
router.get('/', async (req, res) => {
  try {
    const [packages] = await db.execute(
      'SELECT * FROM service_packages WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json(packages);
  } catch (error) {
    console.error('Error fetching service packages:', error);
    res.status(500).json({ error: 'Failed to fetch service packages' });
  }
});

// Get all available packages
router.get('/packages', requireAuth, async (req, res) => {
  try {
    const [packages] = await db.execute(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM packages p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.name
    `);

    // Parse features JSON for each package
    const processedPackages = packages.map(pkg => ({
      ...pkg,
      features: pkg.features ? JSON.parse(pkg.features) : []
    }));

    res.json(processedPackages);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Failed to get packages' });
  }
});

// Get packages by category
router.get('/packages/category/:categoryId', requireAuth, async (req, res) => {
  try {
    const [packages] = await db.execute(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM packages p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.category_id = ?
      ORDER BY p.name
    `, [req.params.categoryId]);

    // Parse features JSON for each package
    const processedPackages = packages.map(pkg => ({
      ...pkg,
      features: pkg.features ? JSON.parse(pkg.features) : []
    }));

    res.json(processedPackages);
  } catch (error) {
    console.error('Get packages by category error:', error);
    res.status(500).json({ error: 'Failed to get packages' });
  }
});

// Get all categories
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get user's active services
router.get('/my-services', requireAuth, async (req, res) => {
  try {
    const [services] = await db.execute(`
      SELECT a.id, a.name, a.category, a.status, a.created_at,
             p.name as package_name, p.description as package_description, 
             p.price as package_price, p.features as package_features,
             c.name as category_name, c.color as category_color
      FROM assets a
      LEFT JOIN packages p ON a.package_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE a.user_id = ? AND a.status = 'active'
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    // Parse features JSON for each service
    const processedServices = services.map(service => ({
      ...service,
      package_features: service.package_features ? JSON.parse(service.package_features) : []
    }));

    res.json(processedServices);
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// Get service statistics
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    // Get total active services
    const [totalServices] = await db.execute(
      'SELECT COUNT(*) as count FROM assets WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );

    // Get services by category
    const [servicesByCategory] = await db.execute(`
      SELECT a.category, COUNT(*) as count
      FROM assets a
      WHERE a.user_id = ? AND a.status = 'active'
      GROUP BY a.category
    `, [req.user.id]);

    // Get monthly cost
    const [monthlyCost] = await db.execute(`
      SELECT SUM(p.price) as total
      FROM assets a
      LEFT JOIN packages p ON a.package_id = p.id
      WHERE a.user_id = ? AND a.status = 'active'
    `, [req.user.id]);

    res.json({
      total_services: totalServices[0].count,
      services_by_category: servicesByCategory,
      monthly_cost: monthlyCost[0].total || 0
    });
  } catch (error) {
    console.error('Get service statistics error:', error);
    res.status(500).json({ error: 'Failed to get service statistics' });
  }
});

// Get pricing information
router.get('/pricing', requireAuth, async (req, res) => {
  try {
    const [pricing] = await db.execute('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
    const priceConfig = pricing[0] || {
      change_request_with_package: 50.00,
      change_request_without_package: 150.00,
      support_ticket_with_package: 25.00,
      support_ticket_without_package: 75.00,
      multi_service_discount_percentage: 10.00
    };

    res.json(priceConfig);
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ error: 'Failed to get pricing information' });
  }
});

module.exports = router; 