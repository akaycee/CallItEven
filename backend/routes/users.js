const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

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
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('-password')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
