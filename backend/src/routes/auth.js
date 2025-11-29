const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const {
  requireAuth,
  validatePassword,
  hashPassword,
  comparePassword,
  logAdminActivity
} = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Register new user
router.post('/register', [
  body('first_name').trim().isLength({ min: 2, max: 100 }).withMessage('Το όνομα πρέπει να έχει 2-100 χαρακτήρες'),
  body('last_name').trim().isLength({ min: 2, max: 100 }).withMessage('Το επώνυμο πρέπει να έχει 2-100 χαρακτήρες'),
  body('email').isEmail().normalizeEmail().withMessage('Απαιτείται έγκυρο email'),
  body('password').custom((value) => {
    const validation = validatePassword(value);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, email, password } = req.body;

    // Check if email already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Αυτό το email είναι ήδη εγγεγραμμένο' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, passwordHash]
    );

    const userId = result.insertId;

    // Send registration confirmation email to user
    await sendEmail('user_registration', email, {
      first_name: first_name
    });

    // Send notification email to admin
    const [admins] = await db.execute(
      'SELECT u.email FROM users u JOIN portal_admins pa ON u.id = pa.user_id WHERE pa.role = "super_admin"'
    );

    if (admins.length > 0) {
      await sendEmail('new_user_notification', admins[0].email, {
        first_name: first_name,
        last_name: last_name,
        email: email
      });
    }

    res.status(201).json({
      message: 'Η εγγραφή ήταν επιτυχής. Παρακαλώ περιμένετε την έγκριση από τον διαχειριστή.',
      userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Η εγγραφή απέτυχε. Παρακαλώ δοκιμάστε ξανά.' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Απαιτείται έγκυρο email'),
  body('password').notEmpty().withMessage('Απαιτείται κωδικός πρόσβασης')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Λάθος email ή κωδικός πρόσβασης' });
    }

    const user = users[0];

    // Check if user is approved
    if (user.status !== 'approved') {
      if (user.status === 'pending') {
        return res.status(401).json({ error: 'Ο λογαριασμός σας εκκρεμεί έγκρισης από τον διαχειριστή. Θα λάβετε email ειδοποίησης μόλις εγκριθεί.' });
      } else if (user.status === 'rejected') {
        return res.status(401).json({ error: 'Ο λογαριασμός σας έχει απορριφθεί. Επικοινωνήστε με τον διαχειριστή για περισσότερες πληροφορίες.' });
      } else if (user.status === 'suspended') {
        return res.status(401).json({ error: 'Ο λογαριασμός σας έχει ανασταλεί. Επικοινωνήστε με τον διαχειριστή.' });
      }
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Λάθος email ή κωδικός πρόσβασης' });
    }

    // Update last login
    await db.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.status;

    // Get admin role if applicable
    const [admins] = await db.execute(
      'SELECT role FROM portal_admins WHERE user_id = ?',
      [user.id]
    );
    const adminRole = admins.length > 0 ? admins[0].role : null;

    // Explicitly save session before sending response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Login failed' });
      }

      console.log('Session saved for user:', user.id);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          status: user.status,
          wallet_balance: user.wallet_balance,
          admin_role: adminRole
        }
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
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
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Request password reset
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token (you might want to create a separate table for this)
    await db.execute(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail('password_reset', email, {
      first_name: user.first_name,
      reset_url: resetUrl
    });

    res.json({ message: 'If the email exists, a reset link has been sent' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Reset password with token
router.post('/reset-password/confirm', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').custom((value) => {
    const validation = validatePassword(value);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const [users] = await db.execute(
      'SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = users[0];

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Password reset confirm error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Change password (authenticated user)
router.put('/change-password', requireAuth, [
  body('current_password').notEmpty().withMessage('Current password required'),
  body('new_password').custom((value) => {
    const validation = validatePassword(value);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    // Verify current password
    const isValidPassword = await comparePassword(current_password, req.user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await hashPassword(new_password);

    // Update password
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Check session status
router.get('/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      userId: req.session.userId
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get current user information
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.status,
        u.wallet_balance,
        u.created_at,
        u.last_login,
        pa.role as admin_role
      FROM users u
      LEFT JOIN portal_admins pa ON u.id = pa.user_id
      WHERE u.id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        status: user.status,
        wallet_balance: user.wallet_balance,
        admin_role: user.admin_role || null,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

module.exports = router; 
