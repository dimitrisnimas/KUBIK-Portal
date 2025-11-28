const nodemailer = require('nodemailer');
const db = require('../config/database');
const moment = require('moment');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
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
      'SELECT * FROM email_templates WHERE name = ? AND is_active = TRUE',
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
      'SELECT COUNT(*) as count FROM email_queue WHERE status = "sent" AND sent_at > ?',
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
    await db.execute(
      `INSERT INTO email_queue 
       (template_name, to_email, subject, body, variables, priority, scheduled_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [templateName, toEmail, subject, body, JSON.stringify(variables), priority]
    );
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
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: processedSubject,
      text: processedBody,
      html: processedBody.replace(/\n/g, '<br>')
    };

    const result = await transporter.sendMail(mailOptions);

    // Log successful send
    await addToQueue(templateName, toEmail, processedSubject, processedBody, variables, 0);
    await db.execute(
      'UPDATE email_queue SET status = "sent", sent_at = NOW() WHERE to_email = ? AND subject = ? ORDER BY id DESC LIMIT 1',
      [toEmail, processedSubject]
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
       WHERE status = "pending" AND attempts < max_attempts 
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
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email.to_email,
          subject: email.subject,
          text: email.body,
          html: email.body.replace(/\n/g, '<br>')
        };

        const result = await transporter.sendMail(mailOptions);

        // Mark as sent
        await db.execute(
          'UPDATE email_queue SET status = "sent", sent_at = NOW() WHERE id = ?',
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
            'UPDATE email_queue SET status = "failed" WHERE id = ?',
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
      'DELETE FROM email_queue WHERE created_at < ? AND status IN ("sent", "failed")',
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
      'SELECT setting_value FROM system_settings WHERE setting_key IN ("bank_iban", "bank_holder")'
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