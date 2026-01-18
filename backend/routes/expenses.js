const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Expense = require('../models/Expense');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', [
  protect,
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0'),
  body('paidBy').notEmpty().withMessage('Paid by user is required'),
  body('splitType').isIn(['equal', 'percentage', 'unequal']).withMessage('Invalid split type'),
  body('splits').isArray({ min: 1 }).withMessage('At least one split is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, totalAmount, paidBy, splitType, splits } = req.body;

    // Calculate split amounts based on split type
    let calculatedSplits = [];

    if (splitType === 'equal') {
      const amountPerPerson = totalAmount / splits.length;
      calculatedSplits = splits.map(split => ({
        user: split.user,
        amount: parseFloat(amountPerPerson.toFixed(2)),
        percentage: parseFloat((100 / splits.length).toFixed(2))
      }));
    } else if (splitType === 'percentage') {
      calculatedSplits = splits.map(split => ({
        user: split.user,
        amount: parseFloat((totalAmount * split.percentage / 100).toFixed(2)),
        percentage: split.percentage
      }));
    } else if (splitType === 'unequal') {
      calculatedSplits = splits.map(split => ({
        user: split.user,
        amount: split.amount,
        percentage: parseFloat((split.amount / totalAmount * 100).toFixed(2))
      }));
    }

    // Create expense
    const expense = await Expense.create({
      description,
      totalAmount,
      paidBy,
      splitType,
      splits: calculatedSplits,
      createdBy: req.user._id
    });

    // Populate user data
    await expense.populate('paidBy splits.user createdBy', 'name email');

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses
// @desc    Get all expenses for the current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { createdBy: req.user._id },
        { paidBy: req.user._id },
        { 'splits.user': req.user._id }
      ]
    })
    .populate('paidBy splits.user createdBy', 'name email')
    .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/tagged
// @desc    Get all expenses where the current user is tagged (in splits)
// @access  Private
router.get('/tagged', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      'splits.user': req.user._id
    })
    .populate('paidBy splits.user createdBy', 'name email')
    .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get a single expense by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy splits.user createdBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user has access to this expense
    const hasAccess = expense.createdBy._id.equals(req.user._id) ||
                     expense.paidBy._id.equals(req.user._id) ||
                     expense.splits.some(split => split.user._id.equals(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this expense' });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Only creator can delete the expense
    if (!expense.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/balance/summary
// @desc    Get balance summary for current user
// @access  Private
router.get('/balance/summary', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user._id },
        { 'splits.user': req.user._id }
      ]
    }).populate('paidBy splits.user', 'name email');

    // Calculate balances
    const balances = {};

    expenses.forEach(expense => {
      const isPayer = expense.paidBy._id.equals(req.user._id);

      expense.splits.forEach(split => {
        const otherUserId = split.user._id.toString();
        const isOtherUser = split.user._id.equals(req.user._id);

        if (isPayer && !isOtherUser) {
          // Current user paid, other user owes them
          if (!balances[otherUserId]) {
            balances[otherUserId] = {
              user: split.user,
              amount: 0
            };
          }
          balances[otherUserId].amount += split.amount;
        } else if (!isPayer && isOtherUser) {
          // Other user paid, current user owes them
          const payerId = expense.paidBy._id.toString();
          if (!balances[payerId]) {
            balances[payerId] = {
              user: expense.paidBy,
              amount: 0
            };
          }
          balances[payerId].amount -= split.amount;
        }
      });
    });

    // Convert to array and format
    const summary = Object.values(balances).map(balance => ({
      user: {
        _id: balance.user._id,
        name: balance.user.name,
        email: balance.user.email
      },
      amount: parseFloat(balance.amount.toFixed(2)),
      type: balance.amount > 0 ? 'owes_you' : 'you_owe'
    })).filter(b => Math.abs(b.amount) > 0.01);

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
