const express = require('express');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { parsePagination } = require('../utils/helpers');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', protect, admin, async (req, res) => {
  try {
    const filter = {};
    const { page, limit, skip } = parsePagination(req.query);

    let query = User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    if (limit > 0) {
      const total = await User.countDocuments(filter);
      query = query.skip(skip).limit(limit);
      res.set('X-Total-Count', total.toString());
    }

    const users = await query;
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user data
// @access  Private (Admin only)
router.put('/users/:id', protect, admin, async (req, res) => {
  try {
    const { name, email, isAdmin } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (typeof isAdmin !== 'undefined') {
      user.isAdmin = isAdmin;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all expenses where this user is involved
    await Expense.deleteMany({
      $or: [
        { paidBy: req.params.id },
        { createdBy: req.params.id },
        { 'splits.user': req.params.id }
      ]
    });

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin statistics
// @access  Private (Admin only)
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExpenses = await Expense.countDocuments();
    const totalAmount = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalUsers,
      totalExpenses,
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
