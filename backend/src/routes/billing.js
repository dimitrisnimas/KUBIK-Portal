const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { body } = require('express-validator');

const router = express.Router();

// Get all invoices for current user
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    const [invoices] = await db.execute(`
      SELECT i.*, a.name as asset_name, a.category as asset_category
      FROM invoices i
      LEFT JOIN assets a ON i.asset_id = a.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `, [req.user.id]);

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// Get single invoice
router.get('/invoices/:id', requireAuth, async (req, res) => {
  try {
    const [invoices] = await db.execute(`
      SELECT i.*, a.name as asset_name, a.category as asset_category
      FROM invoices i
      LEFT JOIN assets a ON i.asset_id = a.id
      WHERE i.id = ? AND i.user_id = ?
    `, [req.params.id, req.user.id]);

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoices[0]);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// Get billing statistics
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invoices,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_invoices,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as total_overdue
      FROM invoices
      WHERE user_id = ?
    `, [req.user.id]);

    const result = {
      total_invoices: Number(stats[0].total_invoices || 0),
      paid_invoices: Number(stats[0].paid_invoices || 0),
      pending_invoices: Number(stats[0].pending_invoices || 0),
      overdue_invoices: Number(stats[0].overdue_invoices || 0),
      total_paid: Number(stats[0].total_paid || 0),
      total_pending: Number(stats[0].total_pending || 0),
      total_overdue: Number(stats[0].total_overdue || 0),
    };

    res.json(result);
  } catch (error) {
    console.error('Get billing statistics error:', error);
    res.status(500).json({ error: 'Failed to get billing statistics' });
  }
});

// Get payment instructions
router.get('/payment-instructions', requireAuth, async (req, res) => {
  try {
    const [settings] = await db.execute(`
      SELECT setting_value FROM system_settings 
      WHERE setting_key IN ('bank_iban', 'bank_holder', 'contact_email')
    `);

    const instructions = {
      bank_iban: settings.find(s => s.setting_key === 'bank_iban')?.setting_value || 'GR12 3456 7890 1234 5678 9012 345',
      bank_holder: settings.find(s => s.setting_key === 'bank_holder')?.setting_value || 'Kubik Digital Services',
      contact_email: settings.find(s => s.setting_key === 'contact_email')?.setting_value || 'info@kubik.gr',
      instructions: [
        'Κάντε μεταφορά στο παραπάνω IBAN',
        'Στο πεδίο "Λόγος" αναφέρετε τον αριθμό τιμολογίου',
        'Στείλτε email επιβεβαίωσης με το απόδειγμα μεταφοράς',
        'Η πληρωμή θα εγγραφεί εντός 24 ωρών'
      ]
    };

    res.json(instructions);
  } catch (error) {
    console.error('Get payment instructions error:', error);
    res.status(500).json({ error: 'Failed to get payment instructions' });
  }
});

// Mark invoice as paid (for user confirmation)
router.post('/invoices/:id/mark-paid', requireAuth, [
  body('payment_method').trim().isLength({ min: 1 }).withMessage('Payment method required'),
  body('payment_reference').optional().trim(),
  body('payment_notes').optional().trim()
], async (req, res) => {
  try {
    const { payment_method, payment_reference, payment_notes } = req.body;

    // Verify invoice belongs to user
    const [invoices] = await db.execute(
      'SELECT id FROM invoices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice with payment info (but keep status as pending for admin verification)
    await db.execute(`
      UPDATE invoices 
      SET payment_method = ?, payment_reference = ?, payment_notes = ?
      WHERE id = ? AND user_id = ?
    `, [payment_method, payment_reference, payment_notes, req.params.id, req.user.id]);

    res.json({ message: 'Payment information recorded. Admin will verify and update status.' });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({ error: 'Failed to record payment information' });
  }
});

// Download invoice for the logged-in user
router.get('/download/:id', requireAuth, async (req, res) => {
  try {
    const [invoices] = await db.execute(`
      SELECT i.*, a.name as asset_name, a.category as asset_category
      FROM invoices i
      LEFT JOIN assets a ON i.asset_id = a.id
      WHERE i.id = ? AND i.user_id = ?
    `, [req.params.id, req.user.id]);
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];
    const pdfPath = invoice.file_path;

    if (pdfPath && fs.existsSync(pdfPath)) {
      return res.download(pdfPath, invoice.filename || path.basename(pdfPath));
    }

    return res.status(404).json({ error: 'PDF file not found for this invoice.' });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

module.exports = router; 