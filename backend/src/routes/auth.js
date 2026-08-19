const crypto = require('crypto');
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { sendLoginOtp } = require('../utils/email');
const {
  cleanupExpiredWorkspaces,
  createWorkspace,
  destroyWorkspace,
} = require('../services/demo-workspaces');

const router = express.Router();

function positiveInteger(value, fallback, minimum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(minimum, parsed) : fallback;
}

const OTP_TTL_MINUTES = positiveInteger(process.env.OTP_TTL_MINUTES, 10, 2);
const OTP_RESEND_SECONDS = positiveInteger(process.env.OTP_RESEND_SECONDS, 60, 30);
const OTP_MAX_ATTEMPTS = 5;
const OTP_EMAIL_LIMIT_PER_15_MINUTES = 5;
const OTP_IP_LIMIT_PER_15_MINUTES = 20;

const otpRequestValidators = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Απαιτείται έγκυρη διεύθυνση email')
    .bail()
    .customSanitizer((value) => value.toLowerCase()),
  body('role')
    .isIn(['admin', 'user'])
    .withMessage('Ο demo ρόλος πρέπει να είναι admin ή user'),
];

const otpVerifyValidators = [
  ...otpRequestValidators,
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Ο κωδικός πρέπει να αποτελείται από 6 ψηφία'),
];

function otpHash(email, role, code) {
  if (!process.env.OTP_HASH_SECRET || process.env.OTP_HASH_SECRET.length < 32) {
    throw new Error('OTP_HASH_SECRET must contain at least 32 characters');
  }

  return crypto
    .createHmac('sha256', process.env.OTP_HASH_SECRET)
    .update(`${email}:${role}:${code}`)
    .digest('hex');
}

function hashesMatch(expected, actual) {
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  return expectedBuffer.length === actualBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function validationError(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;

  res.status(400).json({
    error: 'Invalid authentication request',
    details: errors.array().map(({ msg, path }) => ({ field: path, message: msg })),
  });
  return true;
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

async function findDemoPersona(connection, role) {
  if (role === 'admin') {
    const [users] = await connection.execute(`
      SELECT u.*, pa.role AS admin_role
      FROM public.users u
      JOIN public.portal_admins pa ON pa.user_id = u.id
      WHERE u.status = 'approved' AND pa.role = 'super_admin'
      ORDER BY u.id
      LIMIT 1
    `);
    return users[0];
  }

  const [users] = await connection.execute(`
    SELECT u.*, NULL::text AS admin_role
    FROM public.users u
    LEFT JOIN public.portal_admins pa ON pa.user_id = u.id
    WHERE u.status = 'approved' AND pa.id IS NULL
    ORDER BY u.id
    LIMIT 1
  `);
  return users[0];
}

router.post('/otp/request', otpRequestValidators, async (req, res) => {
  if (validationError(req, res)) return;

  const { email, role } = req.body;
  const requestIp = req.ip || 'unknown';

  try {
    await cleanupExpiredWorkspaces();
    await db.execute(
      "DELETE FROM public.auth_otp_challenges WHERE created_at < NOW() - INTERVAL '24 hours'"
    );

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = otpHash(email, role, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const challenge = await db.transaction(async (connection) => {
      await connection.execute(
        'SELECT pg_advisory_xact_lock(hashtext(?)), pg_advisory_xact_lock(hashtext(?))',
        [`email:${email}`, `ip:${requestIp}`]
      );

      const [rateRows] = await connection.execute(`
        SELECT
          COUNT(*) FILTER (WHERE email = ?) AS email_count,
          COUNT(*) FILTER (WHERE request_ip = ?) AS ip_count,
          MAX(created_at) FILTER (WHERE email = ?) AS latest_email_request
        FROM public.auth_otp_challenges
        WHERE created_at > NOW() - INTERVAL '15 minutes'
      `, [email, requestIp, email]);

      const rate = rateRows[0];
      const latestRequest = rate.latest_email_request
        ? new Date(rate.latest_email_request).getTime()
        : 0;
      const elapsedSeconds = Math.floor((Date.now() - latestRequest) / 1000);

      if (latestRequest && elapsedSeconds < OTP_RESEND_SECONDS) {
        return {
          error: 'Please wait before requesting another code',
          retryAfterSeconds: OTP_RESEND_SECONDS - elapsedSeconds,
        };
      }

      if (Number(rate.email_count) >= OTP_EMAIL_LIMIT_PER_15_MINUTES
        || Number(rate.ip_count) >= OTP_IP_LIMIT_PER_15_MINUTES) {
        return {
          error: 'Too many authentication requests. Please try again later.',
          retryAfterSeconds: 900,
        };
      }

      await connection.execute(`
        UPDATE public.auth_otp_challenges
        SET consumed_at = NOW()
        WHERE email = ? AND requested_role = ? AND consumed_at IS NULL
      `, [email, role]);

      const [result] = await connection.execute(`
        INSERT INTO public.auth_otp_challenges
          (email, requested_role, code_hash, expires_at, request_ip)
        VALUES (?, ?, ?, ?, ?)
      `, [email, role, codeHash, expiresAt, requestIp]);

      return { id: result.insertId };
    });

    if (challenge.error) {
      res.set('Retry-After', String(challenge.retryAfterSeconds));
      return res.status(429).json(challenge);
    }

    try {
      await sendLoginOtp(email, code, OTP_TTL_MINUTES);
    } catch (error) {
      await db.execute(
        'UPDATE public.auth_otp_challenges SET consumed_at = NOW() WHERE id = ?',
        [challenge.id]
      );
      console.error('OTP email delivery failed:', error.message);
      return res.status(503).json({ error: 'Unable to deliver the login code right now' });
    }

    return res.status(202).json({
      message: 'Login code sent',
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      resendAfterSeconds: OTP_RESEND_SECONDS,
    });
  } catch (error) {
    console.error('OTP request failed:', error.message);
    return res.status(500).json({ error: 'Unable to create the login code' });
  }
});

router.post('/otp/verify', otpVerifyValidators, async (req, res) => {
  if (validationError(req, res)) return;

  const { email, role, code } = req.body;

  try {
    const verification = await db.transaction(async (connection) => {
      const [challenges] = await connection.execute(`
        SELECT *
        FROM public.auth_otp_challenges
        WHERE email = ? AND requested_role = ?
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `, [email, role]);

      const challenge = challenges[0];
      if (!challenge || challenge.consumed_at || new Date(challenge.expires_at) <= new Date()) {
        return { error: 'Invalid or expired login code', status: 401 };
      }

      if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
        return { error: 'Too many verification attempts', status: 429 };
      }

      const suppliedHash = otpHash(email, role, code);
      if (!hashesMatch(challenge.code_hash, suppliedHash)) {
        const attempts = challenge.attempts + 1;
        await connection.execute(`
          UPDATE public.auth_otp_challenges
          SET attempts = ?, consumed_at = CASE WHEN ?::integer >= ?::integer THEN NOW() ELSE consumed_at END
          WHERE id = ?
        `, [attempts, attempts, OTP_MAX_ATTEMPTS, challenge.id]);

        return {
          error: attempts >= OTP_MAX_ATTEMPTS
            ? 'Too many verification attempts'
            : 'Invalid or expired login code',
          status: attempts >= OTP_MAX_ATTEMPTS ? 429 : 401,
        };
      }

      const persona = await findDemoPersona(connection, role);
      if (!persona) {
        return { error: 'Demo persona is not configured', status: 503 };
      }

      await connection.execute(
        'UPDATE public.auth_otp_challenges SET consumed_at = NOW() WHERE id = ?',
        [challenge.id]
      );
      return { persona };
    });

    if (verification.error) {
      return res.status(verification.status).json({ error: verification.error });
    }

    const workspace = await createWorkspace({
      email,
      role,
      personaId: verification.persona.id,
    });
    try {
      await regenerateSession(req);
      req.session.userId = verification.persona.id;
      req.session.demoRole = role;
      req.session.verifiedEmail = email;
      req.session.workspaceSchema = workspace.schemaName;
      req.session.workspaceExpiresAt = workspace.expiresAt.toISOString();
      await saveSession(req);
    } catch (error) {
      await destroyWorkspace(workspace.schemaName).catch(() => {});
      throw error;
    }

    return res.json({
      message: 'Login successful',
      user: {
        id: verification.persona.id,
        first_name: verification.persona.first_name,
        last_name: verification.persona.last_name,
        email,
        status: verification.persona.status,
        wallet_balance: verification.persona.wallet_balance,
        admin_role: verification.persona.admin_role || null,
        demo_role: role,
      },
    });
  } catch (error) {
    console.error('OTP verification failed:', error.message);
    return res.status(500).json({ error: 'Unable to verify the login code' });
  }
});

router.post('/logout', async (req, res) => {
  const workspaceSchema = req.session.workspaceSchema;
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((error) => (error ? reject(error) : resolve()));
    });
    if (workspaceSchema) {
      await destroyWorkspace(workspaceSchema).catch((error) => {
        console.error('Deferred workspace cleanup required:', error.message);
      });
    }
    res.clearCookie('kubik_portal_sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout failed:', error.message);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const [admins] = await db.execute(
      'SELECT role FROM portal_admins WHERE user_id = ?',
      [req.user.id]
    );

    return res.json({
      user: {
        id: req.user.id,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        email: req.session.verifiedEmail || req.user.email,
        status: req.user.status,
        wallet_balance: req.user.wallet_balance,
        admin_role: admins[0]?.role || null,
        demo_role: req.session.demoRole || (admins.length > 0 ? 'admin' : 'user'),
      },
    });
  } catch (error) {
    console.error('Unable to fetch current user:', error.message);
    return res.status(500).json({ error: 'Unable to fetch current user' });
  }
});

router.get('/session', (req, res) => {
  return res.json({
    authenticated: Boolean(req.session.userId),
    role: req.session.demoRole || null,
  });
});

module.exports = router;
