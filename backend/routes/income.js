const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Income = require('../models/Income');
const Group = require('../models/Group');
const { expandRecurringIncome } = require('../utils/helpers');

const router = express.Router();

// @route   POST /api/income
// @desc    Create a new income entry
// @access  Private
router.post('/', [
  protect,
  body('source').trim().notEmpty().withMessage('Source is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').notEmpty().withMessage('Date is required'),
  body('category').optional().trim(),
  body('description').optional().trim(),
  body('isRecurring').optional().isBoolean(),
  body('recurrence.frequency').optional().isIn(['weekly', 'biweekly', 'monthly', 'yearly']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { source, amount, date, description, category, group, isRecurring, recurrence } = req.body;

    // If group is specified, validate membership
    if (group) {
      const grp = await Group.findById(group);
      if (!grp) {
        return res.status(404).json({ message: 'Group not found' });
      }
      if (!grp.members.some(m => m.equals(req.user._id))) {
        return res.status(403).json({ message: 'You are not a member of this group' });
      }
    }

    // Validate recurrence
    if (isRecurring && (!recurrence || !recurrence.frequency)) {
      return res.status(400).json({ message: 'Recurrence frequency is required for recurring income' });
    }

    const income = await Income.create({
      user: req.user._id,
      source,
      amount,
      date: new Date(date),
      description: description || '',
      category: category || 'General',
      group: group || undefined,
      isRecurring: isRecurring || false,
      recurrence: isRecurring ? {
        frequency: recurrence.frequency,
        endDate: recurrence.endDate ? new Date(recurrence.endDate) : null
      } : undefined,
    });

    res.status(201).json(income);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/income
// @desc    Get all income entries for current user (with optional date range and recurring expansion)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query = { user: req.user._id };

    let startDate, endDate;
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
      endDate = new Date(req.query.endDate + 'T23:59:59.999Z');
    }

    if (req.query.group) {
      query.group = req.query.group;
    }

    // For date-filtered queries, we need to fetch recurring items that might start before the range
    if (startDate && endDate) {
      // Get non-recurring income within the date range
      const nonRecurring = await Income.find({
        ...query,
        isRecurring: { $ne: true },
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });

      // Get all recurring income that started on or before the end of the range
      const recurring = await Income.find({
        ...query,
        isRecurring: true,
        date: { $lte: endDate }
      }).sort({ date: -1 });

      // Expand recurring entries
      const expandedRecurring = recurring.flatMap(inc =>
        expandRecurringIncome(inc, startDate, endDate)
      );

      const combined = [...nonRecurring.map(i => i.toObject()), ...expandedRecurring]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json(combined);
    }

    // No date filter — return raw records (no expansion)
    const incomes = await Income.find(query).sort({ date: -1 });
    res.json(incomes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/income/:id
// @desc    Get a single income entry
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    if (!income.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(income);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/income/:id
// @desc    Update an income entry
// @access  Private
router.put('/:id', [
  protect,
  body('source').optional().trim().notEmpty().withMessage('Source cannot be empty'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').optional().notEmpty(),
  body('isRecurring').optional().isBoolean(),
  body('recurrence.frequency').optional().isIn(['weekly', 'biweekly', 'monthly', 'yearly']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    if (!income.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this income' });
    }

    const { source, amount, date, description, category, group, isRecurring, recurrence } = req.body;

    if (source !== undefined) income.source = source;
    if (amount !== undefined) income.amount = amount;
    if (date !== undefined) income.date = new Date(date);
    if (description !== undefined) income.description = description;
    if (category !== undefined) income.category = category;
    if (group !== undefined) income.group = group || undefined;
    if (isRecurring !== undefined) {
      income.isRecurring = isRecurring;
      if (isRecurring && recurrence) {
        income.recurrence = {
          frequency: recurrence.frequency,
          endDate: recurrence.endDate ? new Date(recurrence.endDate) : null
        };
      } else if (!isRecurring) {
        income.recurrence = undefined;
      }
    }

    await income.save();
    res.json(income);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/income/:id
// @desc    Delete an income entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    if (!income.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this income' });
    }

    await income.deleteOne();
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
