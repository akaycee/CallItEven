// Express app module (separated from server.js for testing)
const express = require('express');
const logger = require('./utils/logger');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');
const budgetRoutes = require('./routes/budgets');
const incomeRoutes = require('./routes/income');
const cashflowRoutes = require('./routes/cashflow');

const app = express();

// Trust one hop of proxy headers (CRA dev proxy / nginx in production)
// Required for express-rate-limit to read X-Forwarded-For correctly.
app.set('trust proxy', 1);

// CORS — restrict to known origins (fall back to open in dev/test)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : undefined;
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply stricter rate limit to auth routes
app.use('/api/auth', authLimiter, authRoutes);

// Apply general rate limit to all other API routes
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/expenses', apiLimiter, expenseRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/groups', apiLimiter, groupRoutes);
app.use('/api/budgets', apiLimiter, budgetRoutes);
app.use('/api/income', apiLimiter, incomeRoutes);
app.use('/api/cashflow', apiLimiter, cashflowRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CallItEven API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({ err }, err.message || 'Unhandled error');
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;
