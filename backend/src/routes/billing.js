const express = require('express');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { createDemoInvoiceMessage, sendDemoInvoiceEmail } = require('../utils/email');
const { prepareInvoicePdf } = require('../utils/invoice-pdf');

const router = express.Router();

const DEMO_INVOICE_EMAIL_LIMIT = Math.max(
  1,
  Number.parseInt(process.env.DEMO_INVOICE_EMAIL_LIMIT || '5', 10) || 5,
);

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

router.post('/invoices/:id/send-demo', requireAuth, async (req, res) => {
  const verifiedEmail = req.session.verifiedEmail;
  if (!verifiedEmail || verifiedEmail.toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: 'A verified session email is required' });
  }

  try {
    const [admins] = await db.execute(
      'SELECT id FROM portal_admins WHERE user_id = ?',
      [req.user.id],
    );
    const isAdmin = admins.length > 0;
    const params = [req.params.id];
    let ownershipFilter = '';
    if (!isAdmin) {
      ownershipFilter = 'AND i.user_id = ?';
      params.push(req.user.id);
    }

    const [invoices] = await db.execute(`
      SELECT i.*, a.name AS asset_name, a.category AS asset_category
      FROM invoices i
      LEFT JOIN assets a ON a.id = i.asset_id
      WHERE i.id = ? ${ownershipFilter}
      LIMIT 1
    `, params);
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoices[0];
    const message = createDemoInvoiceMessage(invoice);
    const reservation = await db.transaction(async (connection) => {
      await connection.execute(
        'SELECT pg_advisory_xact_lock(hashtext(?))',
        [`demo-invoice:${verifiedEmail}`],
      );
      const [counts] = await connection.execute(`
        SELECT COUNT(*)::int AS count
        FROM email_queue
        WHERE template_name = 'demo_invoice'
          AND to_email = ?
          AND status IN ('processing', 'sent')
      `, [verifiedEmail]);
      if (counts[0].count >= DEMO_INVOICE_EMAIL_LIMIT) return null;

      const [result] = await connection.execute(`
        INSERT INTO email_queue
          (template_name, to_email, subject, body, variables, status, attempts)
        VALUES ('demo_invoice', ?, ?, ?, ?, 'processing', 1)
      `, [
        verifiedEmail,
        message.subject,
        message.html,
        JSON.stringify({ invoiceId: invoice.id, invoiceNumber: invoice.invoice_number }),
      ]);
      return result.insertId;
    });

    if (!reservation) {
      return res.status(429).json({
        error: `Demo invoice email limit reached (${DEMO_INVOICE_EMAIL_LIMIT} per session)`,
      });
    }

    try {
      const delivery = await sendDemoInvoiceEmail(verifiedEmail, {
        ...invoice,
        customer_email: verifiedEmail,
        customer_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim(),
      });
      await db.execute(
        "UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?",
        [reservation],
      );
      return res.json({
        message: 'Demo invoice sent',
        recipient: verifiedEmail,
        attachedPdf: delivery.attachedPdf,
      });
    } catch (error) {
      await db.execute(
        "UPDATE email_queue SET status = 'failed', error_message = ? WHERE id = ?",
        [error.message.slice(0, 1000), reservation],
      );
      console.error('Demo invoice delivery failed:', error.message);
      return res.status(503).json({ error: 'Unable to send the demo invoice right now' });
    }
  } catch (error) {
    console.error('Demo invoice request failed:', error.message);
    return res.status(500).json({ error: 'Unable to process the demo invoice' });
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
  body('payment_method')
    .equals('bank_transfer')
    .withMessage('Only the demo bank transfer method is supported'),
  body('payment_reference')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Payment reference must contain 3 to 100 characters'),
  body('payment_notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Payment notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid payment declaration', details: errors.array() });
    }

    const { payment_method, payment_reference, payment_notes } = req.body;

    // Verify invoice belongs to user
    const [invoices] = await db.execute(
      'SELECT id, status FROM invoices WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoices[0].status !== 'pending') {
      return res.status(409).json({ error: 'Only pending invoices can receive a payment declaration' });
    }

    // Update invoice with payment info (but keep status as pending for admin verification)
    await db.execute(`
      UPDATE invoices 
      SET payment_method = ?, payment_reference = ?, payment_notes = ?
      WHERE id = ? AND user_id = ?
    `, [payment_method, payment_reference, payment_notes, req.params.id, req.user.id]);

    res.json({
      message: 'Payment declaration recorded. An administrator must verify it.',
      payment: {
        method: payment_method,
        reference: payment_reference,
        notes: payment_notes || null,
        status: 'awaiting_verification',
      },
    });
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
    const pdf = await prepareInvoicePdf({
      ...invoice,
      customer_email: req.user.email,
      customer_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim(),
    });
    if (pdf.path) {
      return res.download(pdf.path, pdf.filename);
    }
    res.attachment(pdf.filename);
    return res.type('application/pdf').send(pdf.content);
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

module.exports = router;
