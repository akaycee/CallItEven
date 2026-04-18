const express = require('express');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { parseDateRange } = require('../utils/helpers');
const { DEFAULT_CATEGORIES } = require('../utils/constants');
const User = require('../models/User');
const FamilyGroup = require('../models/FamilyGroup');

const router = express.Router();

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
    let filter;
    if (req.query.household === 'true') {
      const currentUser = await User.findById(req.user._id).select('familyGroup').lean();
      if (!currentUser?.familyGroup) {
        return res.status(400).json({ message: 'You are not in a family group' });
      }
      filter = { user: req.user._id, isFamilyBudget: true };
    } else {
      filter = { user: req.user._id, isFamilyBudget: { $ne: true } };
    }
    const budgets = await Budget.find(filter).sort({ category: 1 }).lean();
    res.json(budgets);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/budgets/summary
// @desc    Get budget vs actual spending for the current month
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const isHousehold = req.query.household === 'true';
    let budgetFilter;
    let splitUserMatch;

    if (isHousehold) {
      const currentUser = await User.findById(req.user._id).select('familyGroup').lean();
      if (!currentUser?.familyGroup) {
        return res.status(400).json({ message: 'You are not in a family group' });
      }
      const family = await FamilyGroup.findById(currentUser.familyGroup).lean();
      if (!family) {
        return res.status(400).json({ message: 'Family group not found' });
      }
      budgetFilter = { user: req.user._id, isFamilyBudget: true };
      splitUserMatch = { $in: family.members };
    } else {
      budgetFilter = { user: req.user._id, isFamilyBudget: { $ne: true } };
      splitUserMatch = req.user._id;
    }

    const budgets = await Budget.find(budgetFilter).lean();

    if (budgets.length === 0) {
      return res.json([]);
    }

    const { startDate, endDate } = parseDateRange(req.query);

    const spendingAgg = await Expense.aggregate([
      {
        $match: {
          'splits.user': splitUserMatch,
          date: { $gte: startDate, $lte: endDate },
          category: { $not: /^Settlement/ },
          ...(isHousehold ? { hideFromFamily: { $ne: true } } : {})
        }
      },
      { $unwind: '$splits' },
      { $match: { 'splits.user': splitUserMatch } },
      {
        $group: {
          _id: { $ifNull: ['$category', 'Uncategorized'] },
          total: { $sum: '$splits.amount' }
        }
      }
    ]);

    const spendingByCategory = {};
    spendingAgg.forEach(item => {
      spendingByCategory[item._id] = item.total;
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
    logger.error({ err: error }, error.message);
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

    const { category, amount, isFamilyBudget, familyGroup } = req.body;

    // Validate category exists
    const validCategories = await getAllCategoryNames();
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Check for duplicate budget
    const existing = await Budget.findOne({ user: req.user._id, category, isFamilyBudget: !!isFamilyBudget });
    if (existing) {
      return res.status(400).json({ message: 'Budget already exists for this category' });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category,
      amount,
      isFamilyBudget: !!isFamilyBudget,
      familyGroup: isFamilyBudget ? familyGroup : undefined
    });

    res.status(201).json(budget);
  } catch (error) {
    logger.error({ err: error }, error.message);
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
    logger.error({ err: error }, error.message);
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
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
