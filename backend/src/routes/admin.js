const express = require('express');
const db = require('../config/database');
const { requireAdmin, requireSuperAdmin, requireAuth } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter called with file:', file);
    // Accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Middleware to handle Multer errors
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.log('Multer error:', error);
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected file field: ${error.field}. Expected field name: pdf_file`
      });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
};

// Helper to fetch VAT rate from system_settings (always use billing.vat_rate)
async function getVatRate() {
  const [settings] = await db.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'billing.vat_rate' LIMIT 1");
  if (settings.length > 0) {
    let raw = settings[0].setting_value;

    // Try to parse as JSON first (since values are stored as JSON strings)
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      // If JSON parse fails, use raw value
    }

    const rate = parseFloat(raw);
    if (!isNaN(rate) && rate >= 0) return rate / 100;
  }
  return 0.0; // fallback to 0% VAT
}

const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}



// Admin users management
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT id, first_name, last_name, email, status, created_at, last_login 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/dashboard-data', requireAdmin, async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM users) as totalClients,
        (SELECT COUNT(*) FROM users WHERE status = 'approved') as activeClients,
        (SELECT COUNT(*) FROM assets) as totalAssets,
        (SELECT IFNULL(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') as totalRevenue,
        (SELECT COUNT(*) FROM invoices WHERE status = 'pending') as pendingInvoices,
        (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdueInvoices,
        (SELECT COUNT(*) FROM tickets WHERE status IN ('open', 'in_progress')) as openTickets,
        (SELECT COUNT(*) FROM tickets WHERE priority = 'urgent') as urgentTickets,
        (SELECT COUNT(*) FROM packages) as totalPackages
    `);

    const [recentClients] = await db.execute(`
      SELECT id, first_name, last_name, email, status, created_at 
      FROM users 
      ORDER BY created_at DESC LIMIT 5
    `);

    const [overdueClients] = await db.execute(`
      SELECT
          u.id, u.first_name, u.last_name, u.email,
          SUM(i.total_amount) as overdue_amount,
          COUNT(i.id) as overdue_invoices
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'overdue'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY overdue_amount DESC
    `);

    const [recentTickets] = await db.execute(`
      SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as client_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC LIMIT 5
    `);

    const [recentInvoices] = await db.execute(`
      SELECT i.*, CONCAT(u.first_name, ' ', u.last_name) as client_name
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC LIMIT 5
    `);

    res.json({
      stats: stats[0],
      recentClients,
      overdueClients,
      recentTickets,
      recentInvoices
    });

  } catch (error) {
    console.error('Admin dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password (you should use bcrypt in production)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(`
      INSERT INTO users (first_name, last_name, email, password_hash, status, created_at)
      VALUES (?, ?, ?, ?, 'approved', NOW())
    `, [first_name, last_name, email, hashedPassword]);

    res.status(201).json({
      id: result.insertId,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['approved', 'rejected', 'suspended'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided. Must be one of: ' + allowedStatuses.join(', ') });
    }

    const [result] = await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin assets management
router.get('/assets', requireAdmin, async (req, res) => {
  try {
    let query = `
      SELECT a.*, u.first_name, u.last_name, u.email as client_email,
             p.name as package_name, p.price as package_price
      FROM assets a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN packages p ON a.package_id = p.id
    `;
    const params = [];
    if (req.query.user_id) {
      query += ' WHERE a.user_id = ?';
      params.push(req.query.user_id);
    }
    query += ' ORDER BY a.created_at DESC';
    const [assets] = await db.execute(query, params);
    res.json(assets);
  } catch (error) {
    console.error('Admin assets error:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

router.post('/assets', requireAdmin, async (req, res) => {
  try {
    const { user_id, name, category, package_id, business_name, vat_number, billing_email, address, billing_phone } = req.body;
    const [result] = await db.execute(`
      INSERT INTO assets (user_id, name, category, package_id, business_name, vat_number, billing_email, address, billing_phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `, [user_id, name, category, package_id, business_name, vat_number, billing_email, address, billing_phone]);
    res.json({ id: result.insertId, message: 'Asset created successfully' });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

router.put('/assets/:id', requireAdmin, async (req, res) => {
  try {
    const { name, category, package_id, business_name, vat_number, billing_email, address, billing_phone } = req.body;
    await db.execute(`
      UPDATE assets 
      SET name = ?, category = ?, package_id = ?, business_name = ?, vat_number = ?, billing_email = ?, address = ?, billing_phone = ?
      WHERE id = ?
    `, [name, category, package_id, business_name, vat_number, billing_email, address, billing_phone, req.params.id]);
    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

router.delete('/assets/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM assets WHERE id = ?', [req.params.id]);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Admin billing management
router.get('/billing/invoices', requireAdmin, async (req, res) => {
  try {
    let query = `
      SELECT i.*, u.first_name, u.last_name, u.email as client_email,
             a.name as asset_name, a.category as asset_category
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN assets a ON i.asset_id = a.id
    `;
    const params = [];
    if (req.query.user_id) {
      query += ' WHERE i.user_id = ?';
      params.push(req.query.user_id);
    }
    query += ' ORDER BY i.created_at DESC';
    const [invoices] = await db.execute(query, params);
    res.json(invoices);
  } catch (error) {
    console.error('Admin billing error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.post('/billing/generate-monthly', requireAdmin, async (req, res) => {
  try {
    const vatRate = await getVatRate();
    // Generate monthly invoices for all active assets
    const [assets] = await db.execute(`
      SELECT a.*, u.id as user_id, p.price
      FROM assets a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN packages p ON a.package_id = p.id
      WHERE a.status = 'active' AND p.price > 0
    `);
    for (const asset of assets) {
      const vatAmount = asset.price * vatRate;
      const totalAmount = asset.price + vatAmount;
      // Use asset name from the initial query, which already includes it.
      const assetName = asset.name ? asset.name.replace(/\s+/g, '') : 'ASSET';
      // Generate increment number per asset
      const [maxInvoice] = await db.execute('SELECT MAX(CAST(SUBSTRING_INDEX(invoice_number, \'-\', -1) AS UNSIGNED)) as max_num FROM invoices WHERE asset_id = ?', [asset.id]);
      const lastNumber = maxInvoice[0].max_num || 0;
      const invoiceNumber = `INV-${assetName}-${lastNumber + 1}`;
      await db.execute(`
        INSERT INTO invoices (user_id, asset_id, invoice_number, amount, vat_amount, total_amount, status, due_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())
      `, [asset.user_id, asset.id, invoiceNumber, asset.price, vatAmount, totalAmount]);
    }
    res.json({ message: 'Monthly invoices generated successfully', count: assets.length });
  } catch (error) {
    console.error('Generate monthly invoices error:', error);
    res.status(500).json({ error: 'Failed to generate monthly invoices' });
  }
});

router.post('/billing/manual-payment', requireAdmin, async (req, res) => {
  try {
    const { invoice_id, amount, payment_method, payment_date, reference, notes } = req.body;
    await db.execute(`
      UPDATE invoices 
      SET status = 'paid', paid_at = ?, payment_method = ?, payment_reference = ?, payment_notes = ?
      WHERE id = ?
    `, [payment_date, payment_method, reference, notes, invoice_id]);
    res.json({ message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Manual payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

router.post('/billing/upload-invoice', requireAdmin, upload.single('pdf_file'), handleMulterError, async (req, res) => {
  try {


    // Check for Multer errors
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }

    const { client_id, asset_id, amount, due_date, description } = req.body;

    // Validate required fields
    if (!client_id || !asset_id || !amount || !due_date) {
      return res.status(400).json({ error: 'Client ID, Asset ID, Amount, and Due Date are required' });
    }

    // Validate client_id is a real user
    const [clientRows] = await db.execute('SELECT id FROM users WHERE id = ?', [client_id]);
    if (clientRows.length === 0) {
      return res.status(400).json({ error: 'Invalid client selected' });
    }
    // The client_id is used as user_id for the invoice, so the client can download it
    const vatRate = await getVatRate();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return res.status(400).json({ error: 'Invalid amount provided.' });
    }
    const vatAmount = numericAmount * vatRate;
    const totalAmount = numericAmount + vatAmount;

    // Fetch asset name
    const [assetRows] = await db.execute('SELECT name FROM assets WHERE id = ?', [asset_id]);
    const assetName = assetRows.length > 0 ? assetRows[0].name.replace(/\s+/g, '') : 'ASSET';
    // Generate increment number per asset
    const [maxInvoice] = await db.execute('SELECT MAX(CAST(SUBSTRING_INDEX(invoice_number, \'-\', -1) AS UNSIGNED)) as max_num FROM invoices WHERE asset_id = ?', [asset_id]);
    const lastNumber = maxInvoice[0].max_num || 0;
    const invoiceNumber = `INV-${assetName}-${lastNumber + 1}`;


    const adminUserId = req.session.userId;

    let filePath = null;
    let fileName = null;
    let fileSize = null;
    if (req.file) {
      // Save PDF to disk
      const ext = path.extname(req.file.originalname) || '.pdf';
      const safeInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '');
      fileName = `${safeInvoiceNumber}${ext}`;
      filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);
      fileSize = req.file.size;
    }
    // Insert invoice with pdf_file_path
    const [result] = await db.execute(`
      INSERT INTO invoices (user_id, asset_id, invoice_number, amount, vat_amount, total_amount, description, status, due_date, created_at, uploaded_by, filename, file_path, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), ?, ?, ?, ?)
    `, [client_id, asset_id, invoiceNumber, numericAmount, vatAmount, totalAmount, description, due_date, adminUserId, fileName, filePath, fileSize]);

    res.status(201).json({
      id: result.insertId,
      invoice_number: invoiceNumber,
      message: 'Invoice uploaded successfully'
    });
  } catch (error) {
    console.error('Upload invoice error:', error);
    res.status(500).json({ error: 'Failed to upload invoice' });
  }
});

router.get('/billing/download/:id', requireAdmin, async (req, res) => {
  try {
    const [invoice] = await db.execute(`
      SELECT i.*, u.first_name, u.last_name, u.email, a.name as asset_name
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN assets a ON i.asset_id = a.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (invoice.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const pdfPath = invoice[0].file_path;
    if (pdfPath && fs.existsSync(pdfPath)) {
      return res.download(pdfPath, path.basename(pdfPath));
    } else {
      return res.status(404).json({ error: 'PDF file not found for this invoice' });
    }
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

// Admin tickets management
router.get('/tickets', requireAdmin, async (req, res) => {
  try {
    let query = `
      SELECT t.*, u.first_name, u.last_name, u.email as client_email,
             CONCAT(u.first_name, ' ', u.last_name) as client_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
    `;
    const params = [];
    if (req.query.user_id) {
      query += ' WHERE t.user_id = ?';
      params.push(req.query.user_id);
    }
    query += ' ORDER BY t.created_at DESC';
    const [tickets] = await db.execute(query, params);

    // Fetch messages for each ticket
    for (let ticket of tickets) {
      const [messages] = await db.execute(`
        SELECT * FROM ticket_messages 
        WHERE ticket_id = ? 
        ORDER BY created_at ASC
      `, [ticket.id]);

      // Map messages to include sender name
      ticket.messages = messages.map(msg => ({
        ...msg,
        sender_name: msg.sender_type === 'admin'
          ? 'Admin'
          : `${ticket.first_name} ${ticket.last_name} `
      }));

      ticket.messages = messages;
      ticket.client = {
        first_name: ticket.first_name,
        last_name: ticket.last_name,
        email: ticket.client_email
      };
    }

    res.json(tickets);
  } catch (error) {
    console.error('Admin tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.post('/tickets/:id/reply', requireAdmin, async (req, res) => {
  try {
    const { content, send_email } = req.body;
    const ticketId = req.params.id;

    await db.execute(`
      INSERT INTO ticket_messages(ticket_id, sender_type, content, created_at)
      VALUES(?, 'admin', ?, NOW())
        `, [ticketId, content]);

    // When an admin replies, update the status to 'answered' to reflect that it's waiting on the client.
    // The client-side should then set it back to 'customer-reply' when they respond.
    await db.execute('UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?', ['answered', ticketId]);
    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Reply to ticket error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

router.put('/tickets/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Ticket status updated successfully' });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Admin packages management
router.get('/packages', requireAdmin, async (req, res) => {
  try {
    const [packages] = await db.execute(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM packages p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
        `);
    res.json(packages);
  } catch (error) {
    console.error('Admin packages error:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

router.post('/packages', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, currency, billing_cycle, category, category_id, features, is_active } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Set default values for optional fields
    const safeDescription = description || null;
    const safeCurrency = currency || 'EUR';
    const safeBillingCycle = billing_cycle || 'monthly';

    // Handle both category and category_id fields
    let safeCategoryId = null;
    if (category_id) {
      safeCategoryId = category_id;
    } else if (category) {
      // If category is a string (category name), find the category ID
      try {
        const [categoryResult] = await db.execute('SELECT id FROM categories WHERE name = ?', [category]);
        if (categoryResult.length > 0) {
          safeCategoryId = categoryResult[0].id;
        }
      } catch (error) {
        console.error('Error finding category:', error);
      }
    }

    const safeFeatures = features ? JSON.stringify(features) : '[]';
    const safeIsActive = is_active !== undefined ? is_active : true;

    const [result] = await db.execute(`
      INSERT INTO packages(name, description, price, currency, billing_cycle, category_id, features, is_active, created_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [name, safeDescription, price, safeCurrency, safeBillingCycle, safeCategoryId, safeFeatures, safeIsActive]);
    res.json({ id: result.insertId, message: 'Package created successfully' });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

router.put('/packages/:id', requireAdmin, async (req, res) => {
  try {


    const { name, description, price, currency, billing_cycle, category, category_id, features, is_active } = req.body;

    // Validate required fields
    if (!name || !price) {

      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Set default values for optional fields
    const safeDescription = description || null;
    const safeCurrency = currency || 'EUR';
    const safeBillingCycle = billing_cycle || 'monthly';

    // Handle both category and category_id fields
    let safeCategoryId = null;
    if (category_id) {
      safeCategoryId = category_id;

    } else if (category) {
      // If category is a string (category name), find the category ID
      try {
        const [categoryResult] = await db.execute('SELECT id FROM categories WHERE name = ?', [category]);
        if (categoryResult.length > 0) {
          safeCategoryId = categoryResult[0].id;
        }
      } catch (error) {
        console.error('Error finding category:', error);
      }
    }

    const safeFeatures = features ? JSON.stringify(features) : '[]';
    const safeIsActive = is_active !== undefined ? is_active : true;



    await db.execute(`
      UPDATE packages 
      SET name = ?, description = ?, price = ?, currency = ?, billing_cycle = ?, category_id = ?, features = ?, is_active = ?
        WHERE id = ?
          `, [name, safeDescription, price, safeCurrency, safeBillingCycle, safeCategoryId, safeFeatures, safeIsActive, req.params.id]);


    res.json({ message: 'Package updated successfully' });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

router.delete('/packages/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM packages WHERE id = ?', [req.params.id]);
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

router.get('/packages/:id/subscribers', requireAdmin, async (req, res) => {
  try {
    const [subscribers] = await db.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.created_at
      FROM users u
      INNER JOIN assets a ON u.id = a.user_id
      WHERE a.package_id = ? AND a.status = 'active'
      ORDER BY u.created_at DESC
        `, [req.params.id]);
    res.json(subscribers);
  } catch (error) {
    console.error('Get package subscribers error:', error);
    res.status(500).json({ error: 'Failed to fetch package subscribers' });
  }
});

// Available packages (for forms and public access)
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
    console.error('Available packages error:', error);
    res.status(500).json({ error: 'Failed to fetch available packages' });
  }
});

// Admin categories management
router.get('/categories', requireAdmin, async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Admin categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Available categories (public endpoint for forms)
router.get('/categories/available', requireAuth, async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Available categories error:', error);
    res.status(500).json({ error: 'Failed to fetch available categories' });
  }
});

router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const { name, color } = req.body;
    const [result] = await db.execute('INSERT INTO categories (name, color) VALUES (?, ?)', [name, color]);
    res.json({ id: result.insertId, message: 'Category created successfully' });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { name, color } = req.body;
    await db.execute('UPDATE categories SET name = ?, color = ? WHERE id = ?', [name, color, req.params.id]);
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Admin email templates management
router.get('/email-templates', requireAdmin, async (req, res) => {
  try {
    const [templates] = await db.execute(`
      SELECT id, name, subject, body as content, variables, is_active, created_at, updated_at
      FROM email_templates 
      ORDER BY name
        `);

    // Parse variables JSON for each template
    const processedTemplates = templates.map(template => ({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : []
    }));

    res.json(processedTemplates);
  } catch (error) {
    console.error('Admin email templates error:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

router.post('/email-templates', requireAdmin, async (req, res) => {
  try {
    const { name, subject, content, variables, is_active } = req.body;

    const [result] = await db.execute(`
      INSERT INTO email_templates(name, subject, body, variables, is_active, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, NOW(), NOW())
        `, [name, subject, content, JSON.stringify(variables || []), is_active ? 1 : 0]);

    res.status(201).json({
      message: 'Email template created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({ error: 'Failed to create email template' });
  }
});

router.put('/email-templates/:id', requireAdmin, async (req, res) => {
  try {
    const { name, subject, content, variables, is_active } = req.body;

    await db.execute(`
      UPDATE email_templates 
      SET name = ?, subject = ?, body = ?, variables = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
        `, [name, subject, content, JSON.stringify(variables || []), is_active ? 1 : 0, req.params.id]);

    res.json({ message: 'Email template updated successfully' });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
});

router.delete('/email-templates/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM email_templates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
});

router.post('/settings/test-email', requireAdmin, async (req, res) => {
  try {
    // Get admin email from session
    const [admins] = await db.execute(
      'SELECT u.email FROM users u JOIN portal_admins pa ON u.id = pa.user_id WHERE pa.role = "super_admin" LIMIT 1'
    );

    if (admins.length === 0) {
      return res.status(400).json({ error: 'No admin email found' });
    }

    // Send test email
    await sendEmail('test_email', admins[0].email, {
      test_message: 'This is a test email from KubikPortal system.'
    });

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

router.post('/settings/backup-database', requireAdmin, async (req, res) => {
  try {
    // For now, return a simple message
    // In production, you would implement actual database backup
    res.json({ message: 'Database backup initiated' });
  } catch (error) {
    console.error('Backup database error:', error);
    res.status(500).json({ error: 'Failed to backup database' });
  }
});

router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const [settings] = await db.execute(`
      SELECT setting_key, setting_value, setting_type
      FROM system_settings 
      ORDER BY setting_key
    `);

    // Convert settings array to object and reconstruct nested objects
    const settingsObject = {};
    settings.forEach(setting => {
      try {
        const value = JSON.parse(setting.setting_value);

        // Handle nested keys (e.g., "company.name" -> company: { name: value })
        const keys = setting.setting_key.split('.');
        let current = settingsObject;

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }

        current[keys[keys.length - 1]] = value;
      } catch (e) {
        // If JSON parsing fails, use the raw value
        const keys = setting.setting_key.split('.');
        let current = settingsObject;

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }

        current[keys[keys.length - 1]] = setting.setting_value;
      }
    });

    res.json(settingsObject);
  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    let adminUserId = req.session.userId;
    if (!adminUserId || isNaN(adminUserId)) {
      console.warn('[WARN] Falling back to admin user ID 1 for settings update.');
      adminUserId = 1;
    }
    // Optionally, check if user exists in DB
    const [userCheck] = await db.execute('SELECT id FROM users WHERE id = ?', [adminUserId]);
    if (userCheck.length === 0) {
      console.warn('[WARN] Fallback admin user ID 1 does not exist. Settings update aborted.');
      return res.status(400).json({ error: 'No valid admin user for updated_by field.' });
    }
    // Clear existing settings
    await db.execute('DELETE FROM system_settings');
    // Flatten nested objects and insert new settings
    const flattenObject = (obj, prefix = '') => {
      const flattened = {};
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key} ` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else {
          // --- VAT RATE NORMALIZATION ---
          if (newKey === 'vat_rate') {
            let normalized = value;
            if (typeof normalized === 'string') normalized = normalized.trim();
            if (typeof normalized === 'string' && normalized.includes(',')) normalized = normalized.replace(',', '.');
            normalized = parseFloat(normalized);
            // If value is less than 1, treat as decimal and convert to percent
            if (!isNaN(normalized) && normalized < 1) {
              normalized = Math.round(normalized * 100);
            }
            // If value is a valid number, store as integer percentage
            if (!isNaN(normalized)) {
              flattened[newKey] = Math.round(normalized);
            } else {
              flattened[newKey] = 24; // fallback
            }
          } else {
            flattened[newKey] = value;
          }
        }
      }
      return flattened;
    };
    const flattenedSettings = flattenObject(settings);
    // Insert new settings with updated_by field
    for (const [key, value] of Object.entries(flattenedSettings)) {
      await db.execute(`
        INSERT INTO system_settings(setting_key, setting_value, setting_type, updated_by, updated_at)
      VALUES(?, ?, ?, ?, NOW())
        `, [key, JSON.stringify(value), typeof value, adminUserId]);
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- Super Admin Management ---
// Create a new super admin user
router.post('/super-admins', requireSuperAdmin, async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    // Check if email already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, status, created_at) VALUES (?, ?, ?, ?, \'approved\', NOW())',
      [first_name, last_name, email, hashedPassword]
    );
    const userId = result.insertId;
    // Add to portal_admins as super_admin
    await db.execute('INSERT INTO portal_admins (user_id, role) VALUES (?, \'super_admin\')', [userId]);
    res.status(201).json({ id: userId, message: 'Super admin created successfully' });
  } catch (error) {
    console.error('Create super admin error:', error);
    res.status(500).json({ error: 'Failed to create super admin' });
  }
});

// Promote existing user to super admin
router.put('/super-admins/:userId', requireSuperAdmin, async (req, res) => {
  console.log('[DEBUG] Entered PUT /super-admins/:userId route handler');
  try {
    const userId = req.params.userId;
    console.log('[DEBUG] Promote to super admin - userId:', userId);
    // Check if user exists
    const [users] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
    console.log('[DEBUG] User query result:', users);
    if (users.length === 0) {
      console.log('[DEBUG] User not found for promotion:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    // Check if already super admin
    const [admins] = await db.execute('SELECT * FROM portal_admins WHERE user_id = ?', [userId]);
    if (admins.length > 0) {
      await db.execute('UPDATE portal_admins SET role = \'super_admin\' WHERE user_id = ?', [userId]);
    } else {
      await db.execute('INSERT INTO portal_admins (user_id, role) VALUES (?, \'super_admin\')', [userId]);
    }
    res.json({ message: 'User promoted to super admin' });
  } catch (error) {
    console.error('Promote to super admin error:', error);
    res.status(500).json({ error: 'Failed to promote user to super admin' });
  }
});

// Demote super admin to basic client
router.delete('/super-admins/:userId', requireSuperAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Remove from portal_admins
    await db.execute('DELETE FROM portal_admins WHERE user_id = ?', [userId]);
    res.json({ message: 'Super admin demoted to basic client' });
  } catch (error) {
    console.error('Demote super admin error:', error);
    res.status(500).json({ error: 'Failed to demote super admin' });
  }
});

// Get all super admins (unique users)
router.get('/super-admins', requireSuperAdmin, async (req, res) => {
  try {
    const [superAdmins] = await db.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, MIN(pa.created_at) as created_at
      FROM users u
      JOIN portal_admins pa ON u.id = pa.user_id
      WHERE pa.role = 'super_admin'
      GROUP BY u.id, u.first_name, u.last_name, u.email
        `);
    res.json(superAdmins);
  } catch (error) {
    console.error('Fetch super admins error:', error);
    res.status(500).json({ error: 'Failed to fetch super admins' });
  }
});

module.exports = router; 
