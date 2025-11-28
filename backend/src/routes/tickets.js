const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../../uploads/tickets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const upload = multer({ dest: uploadsDir });

const router = express.Router();

// Get all tickets for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const [tickets] = await db.execute(`
      SELECT 
        t.*, 
        a.name as asset_name,
        (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id) as message_count
      FROM tickets t
      LEFT JOIN assets a ON t.asset_id = a.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Get single ticket with messages
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [tickets] = await db.execute(`
      SELECT t.*, a.name as asset_name
      FROM tickets t
      LEFT JOIN assets a ON t.asset_id = a.id
      WHERE t.id = ? AND t.user_id = ?
    `, [req.params.id, req.user.id]);

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Get ticket messages
    const [messages] = await db.execute(`
      SELECT * FROM ticket_messages 
      WHERE ticket_id = ? 
      ORDER BY created_at ASC
    `, [req.params.id]);

    res.json({
      ...ticket,
      messages: messages
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

// Create new ticket
router.post('/', requireAuth, upload.array('attachments', 5), [
  body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('asset_id').optional().isInt().withMessage('Valid asset ID required'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Valid priority required'),
  body('price_type').isIn(['with_package', 'without_package']).withMessage('Valid price type required'),
  body('category').isIn(['support', 'change_request', 'bug_report', 'feature_request']).withMessage('Valid category required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, asset_id, priority, price_type, category } = req.body;

    // Verify asset belongs to user if provided
    if (asset_id) {
      const [assets] = await db.execute(
        'SELECT id FROM assets WHERE id = ? AND user_id = ?',
        [asset_id, req.user.id]
      );

      if (assets.length === 0) {
        return res.status(400).json({ error: 'Invalid asset selected' });
      }
    }

    // Get pricing configuration
    const [pricing] = await db.execute('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
    const priceConfig = pricing[0] || {
      support_ticket_with_package: 25.00,
      support_ticket_without_package: 75.00
    };

    // Calculate price based on type
    const price = price_type === 'with_package' 
      ? priceConfig.support_ticket_with_package 
      : priceConfig.support_ticket_without_package;

    const [result] = await db.execute(`
      INSERT INTO tickets (user_id, asset_id, title, description, priority, price, price_type, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, asset_id, title, description, priority, price, price_type, category]);

    const ticketId = result.insertId;

    // Add initial message
    const [messageResult] = await db.execute(`
      INSERT INTO ticket_messages (ticket_id, sender_type, content)
      VALUES (?, 'client', ?)
    `, [ticketId, description]);
    const messageId = messageResult.insertId;

    // Handle attachments
    if (req.files) {
      for (const file of req.files) {
        const newPath = path.join(uploadsDir, `${Date.now()}-${file.originalname}`);
        fs.renameSync(file.path, newPath);
        await db.execute(
          `INSERT INTO ticket_attachments (ticket_message_id, filename, file_path, file_size, mimetype)
           VALUES (?, ?, ?, ?, ?)`,
          [messageId, file.originalname, newPath, file.size, file.mimetype]
        );
      }
    }

    res.status(201).json({
      message: 'Ticket created successfully',
      id: ticketId,
      price: price
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Add message to ticket
router.post('/:id/messages', requireAuth, upload.array('attachments', 5), [
  body('content').trim().isLength({ min: 1 }).withMessage('Message content required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;

    // Verify ticket belongs to user
    const [tickets] = await db.execute(
      'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Add message
    const [messageResult] = await db.execute(`
      INSERT INTO ticket_messages (ticket_id, sender_type, content)
      VALUES (?, 'client', ?)
    `, [req.params.id, content]);
    const messageId = messageResult.insertId;

    // Handle attachments
    if (req.files) {
      for (const file of req.files) {
        const newPath = path.join(uploadsDir, `${Date.now()}-${file.originalname}`);
        fs.renameSync(file.path, newPath);
        await db.execute(
          `INSERT INTO ticket_attachments (ticket_message_id, filename, file_path, file_size, mimetype)
           VALUES (?, ?, ?, ?, ?)`,
          [messageId, file.originalname, newPath, file.size, file.mimetype]
        );
      }
    }

    // Update ticket timestamp and set status to 'customer-reply'
    await db.execute(
      'UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?', 
      ['customer-reply', req.params.id]
    );

    res.json({ message: 'Message added successfully' });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Close ticket
router.put('/:id/close', requireAuth, async (req, res) => {
  try {
    // Verify ticket belongs to user
    const [tickets] = await db.execute(
      'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await db.execute(
      'UPDATE tickets SET status = ?, resolved_at = NOW() WHERE id = ? AND user_id = ?',
      ['closed', req.params.id, req.user.id]
    );

    res.json({ message: 'Ticket closed successfully' });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({ error: 'Failed to close ticket' });
  }
});

// Public ticket pricing endpoint
router.get('/pricing', async (req, res) => {
  try {
    const [pricing] = await db.execute('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
    res.json({ pricing: pricing[0] || {} });
  } catch (error) {
    console.error('Get ticket pricing error:', error);
    res.status(500).json({ error: 'Failed to get ticket pricing' });
  }
});

module.exports = router; 