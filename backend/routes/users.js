const express = require('express');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const { escapeRegex, toUserResponse } = require('../utils/helpers');

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search for users by email
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    // Search for users with email containing the search term
    const users = await User.find({
      email: { $regex: escapeRegex(email), $options: 'i' },
      _id: { $ne: req.user._id }, // Exclude current user
      isAdmin: { $ne: true } // Exclude admin users
    })
    .select('-password')
    .limit(10)
    .lean();

    res.json(users);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').lean();
    res.json(toUserResponse(user));
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const user = await User.findById(req.user._id);

    user.name = name;
    user.email = email;

    // Only update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = password; // Will be hashed by pre-save middleware
    }

    await user.save();

    res.json(toUserResponse(user));
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/notes
// @desc    Update user notes
// @access  Private
router.put('/notes', protect, async (req, res) => {
  try {
    const { notes } = req.body;

    if (notes === undefined) {
      return res.status(400).json({ message: 'Notes field is required' });
    }

    if (notes.length > 5000) {
      return res.status(400).json({ message: 'Notes cannot exceed 5000 characters' });
    }

    await User.findByIdAndUpdate(req.user._id, { notes });

    res.json({ notes });
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/theme
// @desc    Update user theme preference
// @access  Private
router.put('/theme', protect, async (req, res) => {
  try {
    const { themeMode } = req.body;

    if (!themeMode || !['light', 'dark'].includes(themeMode)) {
      return res.status(400).json({ message: 'Invalid theme mode' });
    }

    await User.findByIdAndUpdate(req.user._id, { themeMode });

    res.json({ themeMode });
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
