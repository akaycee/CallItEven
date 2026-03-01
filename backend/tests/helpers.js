const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Create a test user and return user doc + JWT token
 */
async function createTestUser(overrides = {}) {
  const userData = {
    name: overrides.name || 'Test User',
    email: overrides.email || `test${Date.now()}@example.com`,
    password: overrides.password || 'password123',
    isAdmin: overrides.isAdmin || false,
  };

  const user = await User.create(userData);
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  return { user, token };
}

/**
 * Create an admin test user and return user doc + JWT token
 */
async function createAdminUser(overrides = {}) {
  return createTestUser({ ...overrides, isAdmin: true, name: overrides.name || 'Admin User', email: overrides.email || `admin${Date.now()}@example.com` });
}

module.exports = { createTestUser, createAdminUser };
