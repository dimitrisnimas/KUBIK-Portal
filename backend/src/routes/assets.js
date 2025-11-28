const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all assets for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const [assets] = await db.execute(`
      SELECT a.*, p.name as package_name, p.price as package_price, p.features as package_features
      FROM assets a
      LEFT JOIN packages p ON a.package_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    // Parse features JSON for each asset
    const processedAssets = assets.map(asset => ({
      ...asset,
      package_features: asset.package_features ? JSON.parse(asset.package_features) : []
    }));

    res.json(processedAssets);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Failed to get assets' });
  }
});

// Get single asset
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [assets] = await db.execute(`
      SELECT a.*, p.name as package_name, p.price as package_price, p.features as package_features
      FROM assets a
      LEFT JOIN packages p ON a.package_id = p.id
      WHERE a.id = ? AND a.user_id = ?
    `, [req.params.id, req.user.id]);

    if (assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = assets[0];
    asset.package_features = asset.package_features ? JSON.parse(asset.package_features) : [];

    res.json(asset);
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Failed to get asset' });
  }
});

// Create new asset
router.post('/', requireAuth, [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters'),
  body('category').trim().isLength({ min: 2, max: 100 }).withMessage('Category must be 2-100 characters'),
  body('package_id').isInt().withMessage('Valid package ID required'),
  body('vat_number').optional().trim().isLength({ max: 50 }),
  body('address').optional().trim(),
  body('billing_email').optional().isEmail().withMessage('Valid email required'),
  body('billing_phone').optional().trim().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, package_id, vat_number, address, billing_email, billing_phone } = req.body;

    // Verify package exists
    const [packages] = await db.execute('SELECT id FROM packages WHERE id = ? AND is_active = 1', [package_id]);
    if (packages.length === 0) {
      return res.status(400).json({ error: 'Invalid package selected' });
    }

    const [result] = await db.execute(`
      INSERT INTO assets (user_id, name, category, package_id, vat_number, address, billing_email, billing_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [req.user.id, name, category, package_id, vat_number, address, billing_email, billing_phone]);

    res.status(201).json({
      message: 'Asset created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// Update asset
router.put('/:id', requireAuth, [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Name must be 2-255 characters'),
  body('category').trim().isLength({ min: 2, max: 100 }).withMessage('Category must be 2-100 characters'),
  body('package_id').isInt().withMessage('Valid package ID required'),
  body('vat_number').optional().trim().isLength({ max: 50 }),
  body('address').optional().trim(),
  body('billing_email').optional().isEmail().withMessage('Valid email required'),
  body('billing_phone').optional().trim().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, package_id, vat_number, address, billing_email, billing_phone } = req.body;

    // Verify asset belongs to user
    const [assets] = await db.execute(
      'SELECT id FROM assets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Verify package exists
    const [packages] = await db.execute('SELECT id FROM packages WHERE id = ? AND is_active = 1', [package_id]);
    if (packages.length === 0) {
      return res.status(400).json({ error: 'Invalid package selected' });
    }

    await db.execute(`
      UPDATE assets 
      SET name = ?, category = ?, package_id = ?, vat_number = ?, address = ?, billing_email = ?, billing_phone = ?
      WHERE id = ? AND user_id = ?
    `, [name, category, package_id, vat_number, address, billing_email, billing_phone, req.params.id, req.user.id]);

    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete asset
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Verify asset belongs to user
    const [assets] = await db.execute(
      'SELECT id FROM assets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await db.execute('DELETE FROM assets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Get available packages for asset creation
router.get('/packages/available', requireAuth, async (req, res) => {
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
    console.error('Get available packages error:', error);
    res.status(500).json({ error: 'Failed to get packages' });
  }
});

router.get('/categories/available', requireAuth, async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Get available categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});


module.exports = router; 