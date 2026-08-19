const nodemailer = require('nodemailer');
const db = require('../config/database');
const { prepareInvoicePdf } = require('./invoice-pdf');
const moment = require('moment');

// Email transporter configuration
const createTransporter = () => {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });
};

const getSender = () => ({
  name: process.env.SMTP_FROM_NAME || 'KUBIK Portal Demo',
  address: process.env.SMTP_FROM_EMAIL,
});

const sendLoginOtp = async (toEmail, code, expiresInMinutes) => {
  const transporter = createTransporter();
  return transporter.sendMail({
    from: getSender(),
    to: toEmail,
    subject: 'Ο κωδικός σύνδεσής σας στο KUBIK Portal',
    text: `Ο κωδικός σύνδεσής σας είναι ${code}. Λήγει σε ${expiresInMinutes} λεπτά. Αν δεν ζητήσατε εσείς τον κωδικό, αγνοήστε αυτό το email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 16px">KUBIK Portal Demo</h2>
        <p>Χρησιμοποιήστε τον παρακάτω κωδικό για να συνδεθείτε:</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
        <p>Ο κωδικός λήγει σε ${expiresInMinutes} λεπτά και μπορεί να χρησιμοποιηθεί μόνο μία φορά.</p>
        <p style="color:#64748b;font-size:13px">Αν δεν ζητήσατε εσείς τον κωδικό, αγνοήστε αυτό το email.</p>
      </div>
    `,
  });
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatMoney = (value) => new Intl.NumberFormat('el-GR', {
  style: 'currency',
  currency: 'EUR',
}).format(Number(value) || 0);

const formatDate = (value) => new Intl.DateTimeFormat('el-GR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(value));

const sanitizeEmailHeader = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

const createDemoInvoiceMessage = (invoice) => {
  const invoiceNumber = escapeHtml(invoice.invoice_number);
  const assetName = escapeHtml(invoice.asset_name || 'Demo service');
  const description = escapeHtml(invoice.description || 'Demo υπηρεσίες KUBIK Portal');
  const status = escapeHtml(invoice.status);
  const amount = formatMoney(invoice.amount);
  const vatAmount = formatMoney(invoice.vat_amount);
  const totalAmount = formatMoney(invoice.total_amount);
  const dueDate = formatDate(invoice.due_date);
  const subject = `[DEMO] Τιμολόγιο ${sanitizeEmailHeader(invoice.invoice_number)}`;
  const text = [
    'KUBIK Portal Demo',
    `Τιμολόγιο: ${invoice.invoice_number}`,
    `Υπηρεσία: ${invoice.asset_name || 'Demo service'}`,
    `Περιγραφή: ${invoice.description || 'Demo υπηρεσίες KUBIK Portal'}`,
    `Καθαρή αξία: ${amount}`,
    `ΦΠΑ: ${vatAmount}`,
    `Σύνολο: ${totalAmount}`,
    `Ημερομηνία λήξης: ${dueDate}`,
    `Κατάσταση: ${invoice.status}`,
    '',
    'Αυτό είναι αυτοματοποιημένο μήνυμα επίδειξης και δεν αποτελεί φορολογικό παραστατικό.',
  ].join('\n');
  const html = `
    <div style="margin:0;background:#f8fafc;padding:32px 12px;font-family:Arial,sans-serif;color:#0f172a">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="background:#0f172a;padding:24px 28px;color:#ffffff">
          <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8">KUBIK Portal Demo</div>
          <h1 style="font-size:24px;margin:8px 0 0">Τιμολόγιο ${invoiceNumber}</h1>
        </div>
        <div style="padding:28px">
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 14px;font-size:13px;color:#9a3412;margin-bottom:24px">
            Μήνυμα επίδειξης — δεν αποτελεί φορολογικό παραστατικό ή απαίτηση πληρωμής.
          </div>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#64748b">Υπηρεσία</td><td style="padding:8px 0;text-align:right;font-weight:600">${assetName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Περιγραφή</td><td style="padding:8px 0;text-align:right">${description}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Ημερομηνία λήξης</td><td style="padding:8px 0;text-align:right">${dueDate}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Κατάσταση</td><td style="padding:8px 0;text-align:right">${status}</td></tr>
          </table>
          <div style="height:1px;background:#e2e8f0;margin:20px 0"></div>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#64748b">Καθαρή αξία</td><td style="padding:6px 0;text-align:right">${amount}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">ΦΠΑ</td><td style="padding:6px 0;text-align:right">${vatAmount}</td></tr>
            <tr><td style="padding:10px 0 0;font-size:16px;font-weight:700">Σύνολο</td><td style="padding:10px 0 0;text-align:right;font-size:20px;font-weight:700">${totalAmount}</td></tr>
          </table>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
};

const sendDemoInvoiceEmail = async (toEmail, invoice) => {
  const message = createDemoInvoiceMessage(invoice);
  const pdf = await prepareInvoicePdf({ ...invoice, customer_email: toEmail });
  const attachments = [{
    filename: pdf.filename,
    ...(pdf.path ? { path: pdf.path } : { content: pdf.content }),
    contentType: 'application/pdf',
  }];

  const transporter = createTransporter();
  const result = await transporter.sendMail({
    from: getSender(),
    to: toEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments,
  });
  return { ...message, messageId: result.messageId, attachedPdf: true };
};

// Process email template with variables
const processTemplate = (template, variables) => {
  let processedTemplate = template;
  
  if (variables && typeof variables === 'object') {
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      const value = variables[key] || '';
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
    });
  }
  
  return processedTemplate;
};

// Get email template from database
const getEmailTemplate = async (templateName) => {
  try {
    const [templates] = await db.execute(
      'SELECT * FROM email_templates WHERE name = ? AND is_active = 1',
      [templateName]
    );

    if (templates.length === 0) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    return templates[0];
  } catch (error) {
    console.error('Error getting email template:', error);
    throw error;
  }
};

// Check email rate limit
const checkRateLimit = async () => {
  try {
    const oneHourAgo = moment().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
    
    const [sentEmails] = await db.execute(
      "SELECT COUNT(*) as count FROM email_queue WHERE status = 'sent' AND sent_at > ?",
      [oneHourAgo]
    );

    const rateLimit = parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR) || 80;
    
    return sentEmails[0].count < rateLimit;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false;
  }
};

// Add email to queue
const addToQueue = async (templateName, toEmail, subject, body, variables, priority = 0) => {
  try {
    const [result] = await db.execute(
      `INSERT INTO email_queue 
       (template_name, to_email, subject, body, variables, priority, scheduled_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [templateName, toEmail, subject, body, JSON.stringify(variables), priority]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error adding email to queue:', error);
    throw error;
  }
};

// Send email immediately (if rate limit allows)
const sendEmailImmediate = async (templateName, toEmail, variables = {}) => {
  try {
    // Check rate limit
    const canSend = await checkRateLimit();
    if (!canSend) {
      // Add to queue instead
      await sendEmailQueued(templateName, toEmail, variables);
      return { queued: true, message: 'Email queued due to rate limit' };
    }

    // Get template
    const template = await getEmailTemplate(templateName);
    
    // Process template
    const processedSubject = processTemplate(template.subject, variables);
    const processedBody = processTemplate(template.body, variables);

    // Create transporter
    const transporter = createTransporter();

    // Send email
    const mailOptions = {
      from: getSender(),
      to: toEmail,
      subject: processedSubject,
      text: processedBody,
      html: processedBody.replace(/\n/g, '<br>')
    };

    const result = await transporter.sendMail(mailOptions);

    // Log successful send
    const queueId = await addToQueue(templateName, toEmail, processedSubject, processedBody, variables, 0);
    await db.execute(
      "UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?",
      [queueId]
    );

    return { sent: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Add to queue for retry
    try {
      await sendEmailQueued(templateName, toEmail, variables);
      return { queued: true, message: 'Email queued due to error' };
    } catch (queueError) {
      console.error('Error queuing email:', queueError);
      throw error;
    }
  }
};

// Send email via queue
const sendEmailQueued = async (templateName, toEmail, variables = {}) => {
  try {
    const template = await getEmailTemplate(templateName);
    const processedSubject = processTemplate(template.subject, variables);
    const processedBody = processTemplate(template.body, variables);

    await addToQueue(templateName, toEmail, processedSubject, processedBody, variables);
    
    return { queued: true, message: 'Email added to queue' };
  } catch (error) {
    console.error('Error queuing email:', error);
    throw error;
  }
};

// Process email queue (run via cron job)
const processEmailQueue = async () => {
  try {
    // Check rate limit
    const canSend = await checkRateLimit();
    if (!canSend) {
      console.log('Email rate limit reached, skipping queue processing');
      return;
    }

    // Get pending emails ordered by priority and scheduled time
    const [pendingEmails] = await db.execute(
      `SELECT * FROM email_queue 
       WHERE status = 'pending' AND attempts < max_attempts
       ORDER BY priority DESC, scheduled_at ASC 
       LIMIT 10`
    );

    if (pendingEmails.length === 0) {
      return;
    }

    const transporter = createTransporter();

    for (const email of pendingEmails) {
      try {
        // Check rate limit before each email
        const canSendNow = await checkRateLimit();
        if (!canSendNow) {
          console.log('Rate limit reached during queue processing');
          break;
        }

        const mailOptions = {
          from: getSender(),
          to: email.to_email,
          subject: email.subject,
          text: email.body,
          html: email.body.replace(/\n/g, '<br>')
        };

        const result = await transporter.sendMail(mailOptions);

        // Mark as sent
        await db.execute(
          "UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?",
          [email.id]
        );

        console.log(`Email sent successfully: ${email.id} to ${email.to_email}`);

      } catch (error) {
        console.error(`Error sending queued email ${email.id}:`, error);

        // Increment attempts
        await db.execute(
          'UPDATE email_queue SET attempts = attempts + 1, error_message = ? WHERE id = ?',
          [error.message, email.id]
        );

        // Mark as failed if max attempts reached
        if (email.attempts + 1 >= email.max_attempts) {
          await db.execute(
            "UPDATE email_queue SET status = 'failed' WHERE id = ?",
            [email.id]
          );
        }
      }
    }

  } catch (error) {
    console.error('Error processing email queue:', error);
  }
};

// Clean up old emails from queue
const cleanupEmailQueue = async () => {
  try {
    const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss');
    
    await db.execute(
      "DELETE FROM email_queue WHERE created_at < ? AND status IN ('sent', 'failed')",
      [thirtyDaysAgo]
    );

    console.log('Email queue cleaned up');
  } catch (error) {
    console.error('Error cleaning up email queue:', error);
  }
};

// Send welcome email after admin approval
const sendWelcomeEmail = async (userEmail, firstName) => {
  try {
    await sendEmailImmediate('user_approved', userEmail, {
      first_name: firstName
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send payment reminder
const sendPaymentReminder = async (userEmail, userData, serviceData) => {
  try {
    const [settings] = await db.execute(
      "SELECT setting_value FROM system_settings WHERE setting_key IN ('bank_iban', 'bank_holder')"
    );

    const bankIban = settings.find(s => s.setting_key === 'bank_iban')?.setting_value || '';
    const bankHolder = settings.find(s => s.setting_key === 'bank_holder')?.setting_value || '';

    await sendEmailImmediate('payment_reminder', userEmail, {
      first_name: userData.first_name,
      service_name: serviceData.name,
      due_date: serviceData.due_date,
      amount: serviceData.amount,
      bank_iban: bankIban,
      bank_holder: bankHolder
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
  }
};

// Send ticket status update
const sendTicketUpdate = async (userEmail, userData, ticketData) => {
  try {
    await sendEmailImmediate('ticket_status_update', userEmail, {
      first_name: userData.first_name,
      ticket_id: ticketData.id,
      ticket_title: ticketData.title,
      status: ticketData.status
    });
  } catch (error) {
    console.error('Error sending ticket update:', error);
  }
};

// Send asset invitation
const sendAssetInvitation = async (userEmail, userData, assetData, role) => {
  try {
    await sendEmailImmediate('asset_invitation', userEmail, {
      first_name: userData.first_name,
      asset_name: assetData.name,
      role: role
    });
  } catch (error) {
    console.error('Error sending asset invitation:', error);
  }
};

// Main send email function (alias for immediate sending)
const sendEmail = sendEmailImmediate;

module.exports = {
  sendLoginOtp,
  createDemoInvoiceMessage,
  sendDemoInvoiceEmail,
  sendEmail,
  sendEmailImmediate,
  sendEmailQueued,
  processEmailQueue,
  cleanupEmailQueue,
  sendWelcomeEmail,
  sendPaymentReminder,
  sendTicketUpdate,
  sendAssetInvitation,
  getEmailTemplate,
  processTemplate
};
