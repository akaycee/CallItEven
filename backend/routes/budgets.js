const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

const router = express.Router();

// Default categories (same as in categories route)
const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Groceries',
  'Utilities',
  'Healthcare',
  'Travel',
  'Housing',
  'Other'
];

/**
 * Get all valid category names (defaults + custom)
 */
async function getAllCategoryNames() {
  const customCategories = await Category.find().distinct('name');
  return [...new Set([...DEFAULT_CATEGORIES, ...customCategories])];
}

// @route   GET /api/budgets
// @desc    Get all budgets for the current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user._id }).sort({ category: 1 });
    res.json(budgets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/budgets/summary
// @desc    Get budget vs actual spending for the current month
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    // Get all budgets for this user
    const budgets = await Budget.find({ user: req.user._id });

    if (budgets.length === 0) {
      return res.json([]);
    }

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all expenses where the user is in splits, within the current month
    const expenses = await Expense.find({
      'splits.user': req.user._id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      category: { $not: /^Settlement/ }
    });

    // Calculate spending per category (user's share only)
    const spendingByCategory = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      const userSplit = expense.splits.find(
        s => s.user.toString() === req.user._id.toString()
      );
      const userAmount = userSplit ? userSplit.amount : 0;
      spendingByCategory[category] = (spendingByCategory[category] || 0) + userAmount;
    });

    // Build summary: one entry per budget
    const summary = budgets.map(budget => ({
      _id: budget._id,
      category: budget.category,
      budgetAmount: budget.amount,
      spentAmount: parseFloat((spendingByCategory[budget.category] || 0).toFixed(2))
    }));

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', [
  protect,
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount } = req.body;

    // Validate category exists
    const validCategories = await getAllCategoryNames();
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Check for duplicate budget
    const existing = await Budget.findOne({ user: req.user._id, category });
    if (existing) {
      return res.status(400).json({ message: 'Budget already exists for this category' });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category,
      amount
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put('/:id', [
  protect,
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Only the owner can update
    if (!budget.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this budget' });
    }

    budget.amount = req.body.amount;
    await budget.save();

    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Only the owner can delete
    if (!budget.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this budget' });
    }

    await budget.deleteOne();
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
