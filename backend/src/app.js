const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const PgSession = require('connect-pg-simple')(session);
const db = require('./config/database');

// Route imports
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const assetsRouter = require('./routes/assets');
const servicesRouter = require('./routes/services');
const ticketsRouter = require('./routes/tickets');
const billingRouter = require('./routes/billing');
const emailRouter = require('./routes/email');
const adminRouter = require('./routes/admin');
const systemRouter = require('./routes/system');

const app = express();

const productionRequiredEnv = [
  'DATABASE_URL',
  'FRONTEND_URL',
  'SESSION_SECRET',
  'OTP_HASH_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM_EMAIL',
];

if (process.env.NODE_ENV === 'production') {
  const missing = productionRequiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (process.env.SESSION_SECRET.length < 32 || process.env.OTP_HASH_SECRET.length < 32) {
    throw new Error('SESSION_SECRET and OTP_HASH_SECRET must contain at least 32 characters');
  }
}

// Trust the Vercel proxy so secure cookies use the original HTTPS request.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));

// Session store
const sessionStore = new PgSession({
  pool: db.pool,
  tableName: 'sessions',
  createTableIfMissing: true,
  pruneSessionInterval: 15 * 60,
  ttl: 3 * 60 * 60,
});

// Session configuration
app.use(session({
  key: 'kubik_portal_sid',
  secret: process.env.SESSION_SECRET || 'development-session-secret-not-for-production',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}));

// File uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/email', emailRouter);
app.use('/api/admin', adminRouter);
app.use('/api/system', systemRouter);

// Dashboard routes for client dashboard
const dashboardRouter = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler (move to end)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

module.exports = app; 
